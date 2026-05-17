import { inject, injectable } from "inversify";
import type { IAuthentication } from "~/infrastructure/config/better-auth.config";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import type { IPostgresPersistence } from "~/infrastructure/persistence/postgres.persistence";
import { zHttpGetUserSessionNullable } from "~/infrastructure/validation/http/user.http.validation";
import type { IzUserSesssionResponseMinimal } from "~/infrastructure/validation/responses/user.response.validation";
import { HttpError, HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";
import { HttpRoute, type RequestContext, RequestSchema } from "../../route";

const zGetUserSessionRequestSchema = RequestSchema({});
const zGetUserSessionResponseSchema = ResponseSchema({
  data: zHttpGetUserSessionNullable,
});

@injectable()
export class UserProfileRoute extends HttpRoute {
  constructor(
    @inject(INFRASTRUCTURE_SYMBOL.Logger) logger: ILogger,
    @inject(INFRASTRUCTURE_SYMBOL.Postgres)
    private readonly postgres: IPostgresPersistence,
  ) {
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
  }: RequestContext<
    typeof zGetUserSessionRequestSchema,
    typeof zGetUserSessionResponseSchema,
    false
  >) {
    if (!authenticationCtx) {
      return response.success({ session: null });
    }

    const memberships = await this.postgres.client.query.memberSchema.findMany({
      where: ({ userId }, { eq }) =>
        eq(userId, authenticationCtx.session.userId),
      with: { organization: { columns: { metadata: false } } },
    });

    let activeOrganization: IAuthentication["Organization"] | null = null;

    if (authenticationCtx.session.activeOrganizationId) {
      activeOrganization =
        memberships.find(
          (membership) =>
            membership.organization.id ===
            authenticationCtx.session.activeOrganizationId,
        )?.organization ?? null;
    }

    if (authenticationCtx.session.activeOrganizationId && !activeOrganization) {
      return response.unsuccessful({
        code: HttpError.CONFLICT,
        message: "Active organization is not available for this session",
        detail: {
          organizationId: authenticationCtx.session.activeOrganizationId,
        },
      });
    }

    return response.success({
      session: this.serializeSession(
        authenticationCtx.user,
        activeOrganization,
        memberships.map((membership) => membership.organization),
      ),
    });
  }

  private serializeSession(
    user: IAuthentication["Session"]["user"],
    activeOrganization: IAuthentication["Organization"] | null,
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
        createdAt: activeOrganization.createdAt,
      },
      organizations: organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo ?? null,
        createdAt: organization.createdAt,
      })),
    };
  }
}
