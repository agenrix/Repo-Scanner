import { inject, injectable } from "inversify";
import z from "zod";
import {
  HttpRoute,
  type RequestContext,
  RequestSchema,
} from "~/cmd/http/route";
import { env } from "~/infrastructure/config/env.config";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import { HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";

const zConnectRequestSchema = RequestSchema({
  body: z.object({ redirectUri: z.url() }),
  params: z.object({ organizationId: z.string() }),
});
const zConnectResponseSchema = ResponseSchema({
  data: z.object({ url: z.url() }),
});

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
    authentication,
    data,
    logger,
    response,
  }: RequestContext<
    typeof zConnectRequestSchema,
    typeof zConnectResponseSchema,
    true
  >) {
    const state = Buffer.from(
      JSON.stringify({
        redirectUri: data.body.redirectUri,
        organizationId: data.params.organizationId,
        userId: authentication.session.userId,
      }),
    ).toString("base64url");

    logger.info(
      { organizationId: data.params.organizationId },
      `Received connect request for ${data.params.organizationId}`,
    );

    const appInstallationUrl = new URL(
      env.integrations.github.appInstallationUrl,
    );

    appInstallationUrl.searchParams.set("state", state);

    return response.success({ url: appInstallationUrl.toString() });
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
