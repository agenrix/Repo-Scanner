import { and, eq } from "@agenrix/pg/orm";
import type { ISelectOrganization, ISelectUser } from "@agenrix/pg/schema";
import { memberSchema, sessionSchema } from "@agenrix/pg/schema";
import { inject, injectable } from "inversify";

type IActiveOrganization = Omit<ISelectOrganization, "metadata">;

import z from "zod";
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

const zSetActiveOrganizationRequestSchema = RequestSchema({
  body: z.object({ organizationId: z.string().uuid() }),
});
const zSetActiveOrganizationResponseSchema = ResponseSchema({
  data: z.object({ success: z.literal(true) }),
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

    this.register({
      method: HttpMethod.PATCH,
      path: "/",
      authenticated: true,
      requestSchema: zSetActiveOrganizationRequestSchema,
      responseSchema: zSetActiveOrganizationResponseSchema,
      handler: this.setActiveOrganization.bind(this),
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

    let activeOrganization: IActiveOrganization | null = null;

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
    user: ISelectUser,
    activeOrganization: IActiveOrganization | null,
    organizations: IActiveOrganization[],
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

  private async setActiveOrganization({
    authentication,
    data,
    response,
  }: RequestContext<
    typeof zSetActiveOrganizationRequestSchema,
    typeof zSetActiveOrganizationResponseSchema,
    true
  >) {
    // Verify the user is actually a member of this organization
    const membership = await this.postgres.client.query.memberSchema.findFirst({
      where: ({ organizationId, userId }) =>
        and(
          eq(organizationId, data.body.organizationId),
          eq(userId, authentication.user.id),
        ),
    });

    if (!membership) {
      return response.unsuccessful({
        code: HttpError.FORBIDDEN,
        message: "You are not a member of this organization",
      });
    }

    // Stamp the active organization ID onto the current session row
    await this.postgres.client
      .update(sessionSchema)
      .set({ activeOrganizationId: data.body.organizationId })
      .where(eq(sessionSchema.token, authentication.session.token));

    return response.success({ success: true });
  }
}
