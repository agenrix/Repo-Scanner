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

const zCallbackRequestSchema = RequestSchema({
  query: z.object({ code: z.string(), state: z.string() }),
});
const zCallbackResponseSchema = ResponseSchema({ data: z.null() });

@injectable()
export class GithubIntegrationCallbackRoute extends HttpRoute {
  constructor(@inject(INFRASTRUCTURE_SYMBOL.Logger) logger: ILogger) {
    super(logger);
  }

  protected override setupRoutes(): void {
    this.register({
      method: HttpMethod.GET,
      path: "/",
      requestSchema: zCallbackRequestSchema,
      responseSchema: zCallbackResponseSchema,
      authenticated: false,
      handler: this.handleCallback.bind(this),
    });
  }

  private async handleCallback({
    logger,
    data,
    response,
  }: RequestContext<
    typeof zCallbackRequestSchema,
    typeof zCallbackResponseSchema,
    false
  >) {
    logger.info(
      {
        code: data.query.code,
        state: data.query.state,
      },
      `Received callback for Github integration`,
    );

    return response.success(null);
  }
}
