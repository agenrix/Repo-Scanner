import { Hono } from "hono";
import { injectable } from "inversify";
import z from "zod";
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
  TAuthenticated extends true ? AuthenticationContext : null;

export interface RequestContext<
  TRequestSchema extends AnyRequestSchema,
  TResponseSchema extends AnyResponseSchema,
  TAuthenticated extends boolean,
> {
  data: z.output<TRequestSchema>;
  response: IResponseUtils<TResponseSchema>;
  authentication: RouteAuthentication<TAuthenticated>;
}

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

  constructor() {
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
    const routeHandler = this.processRequest(
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

  private processRequest<
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

        return await handler({
          data: validationResult.data,
          response,
          authentication: (authenticated
            ? ctx.var.authentication
            : null) as RouteAuthentication<TAuthenticated>,
        });
      } catch {
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
