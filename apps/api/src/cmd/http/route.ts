import type { PinoLogger } from "@agenrix/logger";
import { Hono } from "hono";
import { injectable } from "inversify";
import z from "zod";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import { HttpError, HttpMethod } from "~/shared/types/http.types";
import {
  type AnyResponseSchema,
  type IResponseUtils,
  ResponseUtils,
} from "~/shared/utils/response.utils";
import { safeValidate } from "~/shared/utils/zod.utils";
import type { IHttpApp, IHttpContext } from "./types";

export interface IHttpRoute {
  init(): Promise<IHttpApp>;
}

export const RequestSchema = <
  TBody extends z.ZodType = z.ZodUndefined,
  TQuery extends z.ZodType = z.ZodUndefined,
  TParams extends z.ZodType = z.ZodUndefined,
  THeaders extends z.ZodType = z.ZodUndefined,
>(args?: {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
  headers?: THeaders;
}) => {
  return z.object({
    body: (args?.body ?? z.undefined()) as TBody,
    query: (args?.query ?? z.object({})) as TQuery,
    params: (args?.params ?? z.object({})) as TParams,
    headers: (args?.headers ?? z.object({})) as THeaders,
  });
};

type AnyRequestSchema = ReturnType<typeof RequestSchema>;
type AuthenticationContext = NonNullable<IHttpContext["var"]["authentication"]>;
type RouteAuthentication<TAuthenticated extends boolean> =
  TAuthenticated extends true
    ? { authentication: AuthenticationContext }
    : { authentication?: AuthenticationContext };

export type RequestContext<
  TRequestSchema extends AnyRequestSchema,
  TResponseSchema extends AnyResponseSchema,
  TAuthenticated extends boolean,
> = {
  data: z.output<TRequestSchema>;
  response: IResponseUtils<TResponseSchema>;
  logger: PinoLogger;
  headers: Headers;
  ctx: IHttpContext;
} & RouteAuthentication<TAuthenticated>;

type RouteHandler<
  TRequestSchema extends AnyRequestSchema,
  TResponseSchema extends AnyResponseSchema,
  TAuthenticated extends boolean,
> = (
  args: RequestContext<TRequestSchema, TResponseSchema, TAuthenticated>,
) => Response | Promise<Response>;

interface RegisterRouteParams<
  TRequestSchema extends AnyRequestSchema,
  TResponseSchema extends AnyResponseSchema,
  TAuthenticated extends boolean,
> {
  method: HttpMethod;
  path: string;
  requestSchema: TRequestSchema;
  responseSchema: TResponseSchema;
  authenticated: TAuthenticated;
  handler: RouteHandler<TRequestSchema, TResponseSchema, TAuthenticated>;
}

@injectable()
export abstract class HttpRoute implements IHttpRoute {
  private readonly router: IHttpApp;
  private initialized = false;

  constructor(private readonly logger: ILogger) {
    this.router = new Hono();
  }

  protected abstract setupRoutes(): void;

  async init(): Promise<IHttpApp> {
    if (!this.initialized) {
      this.setupRoutes();
      this.initialized = true;
    }

    return this.router;
  }

  protected register<
    TRequestSchema extends AnyRequestSchema,
    TResponseSchema extends AnyResponseSchema,
    TAuthenticated extends boolean,
  >({
    method,
    path,
    requestSchema,
    responseSchema,
    authenticated,
    handler,
  }: RegisterRouteParams<TRequestSchema, TResponseSchema, TAuthenticated>) {
    const routeHandler = this.handleRequest(
      requestSchema,
      responseSchema,
      authenticated,
      handler,
    );

    switch (method) {
      case HttpMethod.GET:
        this.router.get(path, routeHandler);
        return;
      case HttpMethod.POST:
        this.router.post(path, routeHandler);
        return;
      case HttpMethod.PUT:
        this.router.put(path, routeHandler);
        return;
      case HttpMethod.PATCH:
        this.router.patch(path, routeHandler);
        return;
      case HttpMethod.DELETE:
        this.router.delete(path, routeHandler);
        return;
    }
  }

  private handleRequest<
    TRequestSchema extends AnyRequestSchema,
    TResponseSchema extends AnyResponseSchema,
    TAuthenticated extends boolean,
  >(
    requestSchema: TRequestSchema,
    responseSchema: TResponseSchema,
    authenticated: TAuthenticated,
    handler: RouteHandler<TRequestSchema, TResponseSchema, TAuthenticated>,
  ) {
    return async (ctx: IHttpContext) => {
      const response = new ResponseUtils(ctx, responseSchema);

      try {
        if (authenticated && ctx.var.authentication === null) {
          return response.unauthorized();
        }

        const request = {
          body: await this.getRequestBody(ctx),
          query: ctx.req.query(),
          params: ctx.req.param(),
          headers: ctx.req.header(),
        };

        const requestData = request as z.input<TRequestSchema>;
        const validationResult = safeValidate(requestSchema, requestData);

        if (!validationResult.success) {
          return response.unsuccessful({
            code: HttpError.BAD_REQUEST,
            message: "Invalid request",
            detail: validationResult.error.message,
          });
        }

        const requestContext = {
          data: validationResult.data,
          response,
          logger: this.logger.general.child({ reqId: ctx.var.reqId }),
          ...(ctx.var.authentication !== null
            ? { authentication: ctx.var.authentication }
            : {}),
          headers: ctx.req.raw.headers,
          ctx,
        } as RequestContext<TRequestSchema, TResponseSchema, TAuthenticated>;

        return await handler(requestContext);
      } catch (error) {
        this.logger.general.error({ error, reqId: ctx.var.reqId });
        return response.somethingWentWrong();
      }
    };
  }

  private async getRequestBody(ctx: IHttpContext) {
    if (ctx.req.method === HttpMethod.GET) {
      return undefined;
    }

    const contentType = ctx.req.header("content-type");

    if (!contentType?.includes("application/json")) {
      return undefined;
    }

    return await ctx.req.json();
  }
}
