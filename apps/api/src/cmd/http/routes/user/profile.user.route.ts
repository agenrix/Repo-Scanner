import { inject, injectable } from "inversify";
import z from "zod";
import type { authentication } from "~/infrastructure/config/better-auth.config";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import {
  zHttpGetUserMinimal,
  zHttpGetUserNullable,
} from "~/infrastructure/validation/http/user.http.validation";
import type { IzUserResponseMinimal } from "~/infrastructure/validation/responses/user.response.validation";
import { HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";
import { HttpRoute, type RequestContext, RequestSchema } from "../../route";

const zGetUserRequestSchema = RequestSchema({});
const zGetUserResponseSchema = ResponseSchema({
  data: zHttpGetUserNullable,
});

const zOnboardUserRequestSchema = RequestSchema({
  body: z.object({ name: z.string(), avatar: z.url() }),
});
const zOnboardUserResponseSchema = ResponseSchema({
  data: zHttpGetUserMinimal,
});

@injectable()
export class UserProfileRoute extends HttpRoute {
  constructor(@inject(INFRASTRUCTURE_SYMBOL.Logger) logger: ILogger) {
    super(logger);
  }

  protected override setupRoutes(): void {
    this.register({
      method: HttpMethod.GET,
      path: "/",
      authenticated: false,
      requestSchema: zGetUserRequestSchema,
      responseSchema: zGetUserResponseSchema,
      handler: this.getUser.bind(this),
    });

    this.register({
      method: HttpMethod.PATCH,
      path: "/",
      authenticated: true,
      requestSchema: zOnboardUserRequestSchema,
      responseSchema: zOnboardUserResponseSchema,
      handler: this.onboardUser.bind(this),
    });
  }

  private async getUser({
    authentication,
    response,
  }: RequestContext<
    typeof zGetUserRequestSchema,
    typeof zGetUserResponseSchema,
    false
  >) {
    return response.success({
      user: authentication ? this.serializeUser(authentication.user) : null,
    });
  }

  private async onboardUser({
    authentication,
    response,
  }: RequestContext<
    typeof zOnboardUserRequestSchema,
    typeof zOnboardUserResponseSchema,
    true
  >) {
    return response.success({ user: this.serializeUser(authentication.user) });
  }

  private serializeUser(
    user: typeof authentication.$Infer.Session.user,
  ): IzUserResponseMinimal {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
    };
  }
}
