import { inject, injectable } from "inversify";
import z from "zod";
import {
  HttpRoute,
  type RequestContext,
  RequestSchema,
} from "~/cmd/http/route";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import { HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";

const zConnectRequestSchema = RequestSchema({
  params: z.object({ organizationId: z.string() }),
});
const zConnectResponseSchema = ResponseSchema({ data: z.null() });

const zDisconnectRequestSchema = RequestSchema({
  params: z.object({ organizationId: z.string() }),
});
const zDisconnectResponseSchema = ResponseSchema({ data: z.null() });

@injectable()
export class GithubIntegrationRoute extends HttpRoute {
  constructor(@inject(INFRASTRUCTURE_SYMBOL.Logger) logger: ILogger) {
    super(logger);
  }

  protected override setupRoutes(): void {
    this.register({
      method: HttpMethod.POST,
      path: "/:organizationId",
      authenticated: true,
      requestSchema: zConnectRequestSchema,
      responseSchema: zConnectResponseSchema,
      handler: this.connect.bind(this),
    });

    this.register({
      method: HttpMethod.DELETE,
      path: "/:organizationId",
      authenticated: true,
      requestSchema: zDisconnectRequestSchema,
      responseSchema: zDisconnectResponseSchema,
      handler: this.disconnect.bind(this),
    });
  }

  private async connect({
    data,
    logger,
    response,
  }: RequestContext<
    typeof zConnectRequestSchema,
    typeof zConnectResponseSchema,
    true
  >) {
    logger.info(
      { organizationId: data.params.organizationId },
      `Received connect request for ${data.params.organizationId}`,
    );

    return response.success(null);
  }
  private async disconnect({
    data,
    logger,
    response,
  }: RequestContext<
    typeof zDisconnectRequestSchema,
    typeof zDisconnectResponseSchema,
    true
  >) {
    logger.info(
      { organizationId: data.params.organizationId },
      `Received disconnect request for ${data.params.organizationId}`,
    );

    return response.success(null);
  }
}
