import { inject, injectable } from "inversify";
import {
  authentication,
  type IAuthentication,
} from "~/infrastructure/config/better-auth.config";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import { zHttpGetUserSessionNullable } from "~/infrastructure/validation/http/user.http.validation";
import type { IzUserSesssionResponseMinimal } from "~/infrastructure/validation/responses/user.response.validation";
import { HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";
import { HttpRoute, type RequestContext, RequestSchema } from "../../route";

const zGetUserSessionRequestSchema = RequestSchema({});
const zGetUserSessionResponseSchema = ResponseSchema({
  data: zHttpGetUserSessionNullable,
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
      requestSchema: zGetUserSessionRequestSchema,
      responseSchema: zGetUserSessionResponseSchema,
      handler: this.getUserSession.bind(this),
    });
  }

  private async getUserSession({
    authentication: authenticationCtx,
    response,
    headers,
  }: RequestContext<
    typeof zGetUserSessionRequestSchema,
    typeof zGetUserSessionResponseSchema,
    false
  >) {
    if (!authenticationCtx) {
      return response.success({ session: null });
    }

    let activeOrganization: IAuthentication["ActiveOrganization"] | null = null;

    if (authenticationCtx.session.activeOrganizationId) {
      activeOrganization = await authentication.api.getFullOrganization({
        query: {
          organizationId: authenticationCtx.session.activeOrganizationId,
        },
        headers,
      });
    }

    const organizations = await authentication.api.listOrganizations({
      headers,
    });

    return response.success({
      session: this.serializeSession(
        authenticationCtx.user,
        activeOrganization,
        organizations,
      ),
    });
  }

  private serializeSession(
    user: IAuthentication["Session"]["user"],
    activeOrganization: IAuthentication["ActiveOrganization"] | null,
    organizations: IAuthentication["Organization"][],
  ): IzUserSesssionResponseMinimal {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      },
      activeOrganization: activeOrganization && {
        id: activeOrganization.id,
        name: activeOrganization.name,
        slug: activeOrganization.slug,
        logo: activeOrganization.logo ?? null,
        metadata: activeOrganization.metadata ?? {},
        createdAt: activeOrganization.createdAt,
      },
      organizations: organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo ?? null,
        metadata: organization.metadata ?? {},
        createdAt: organization.createdAt,
      })),
    };
  }
}
