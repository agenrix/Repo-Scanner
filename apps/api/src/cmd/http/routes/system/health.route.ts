import { injectable } from "inversify";
import z from "zod";
import { HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";
import { HttpRoute, type RequestContext, RequestSchema } from "../../route";

const zGetHealthRequestSchema = RequestSchema({});
const zGetHealthResponseSchema = ResponseSchema({
  data: z.object({ message: z.string() }),
});

@injectable()
export class HealthRoute extends HttpRoute {
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
  }: RequestContext<
    typeof zGetHealthRequestSchema,
    typeof zGetHealthResponseSchema,
    false
  >): Promise<Response> {
    return response.success({ message: `authentication is ${authentication}` });
  }
}
