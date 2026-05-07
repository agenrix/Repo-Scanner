import { inject, injectable } from "inversify";
import z from "zod";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import { HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";
import { HttpRoute, type RequestContext, RequestSchema } from "../../route";

const zGetHealthRequestSchema = RequestSchema({});
const zGetHealthResponseSchema = ResponseSchema({
  data: z.object({ message: z.string() }),
});

@injectable()
export class HealthRoute extends HttpRoute {
  constructor(@inject(INFRASTRUCTURE_SYMBOL.Logger) logger: ILogger) {
    super(logger);
  }

  setupRoutes(): void {
    this.register({
      authenticated: false,
      requestSchema: zGetHealthRequestSchema,
      responseSchema: zGetHealthResponseSchema,
      path: "/",
      method: HttpMethod.GET,
      handler: this.getHealth.bind(this),
    });
  }

  private async getHealth({
    authentication,
    response,
    logger,
  }: RequestContext<
    typeof zGetHealthRequestSchema,
    typeof zGetHealthResponseSchema,
    false
  >): Promise<Response> {
    logger.info("handling health check");
    return response.success({ message: `authentication is ${authentication}` });
  }
}
