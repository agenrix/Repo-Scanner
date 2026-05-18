import { and, eq } from "@agenrix/pg/orm";
import {
  invitationSchema,
  memberSchema,
  organizationSchema,
} from "@agenrix/pg/schema";
import { inject, injectable } from "inversify";
import z from "zod";
import { sendInvitationEmail } from "~/infrastructure/email/email.service";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import type { IPostgresPersistence } from "~/infrastructure/persistence/postgres.persistence";
import { HttpError, HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";
import { HttpRoute, type RequestContext, RequestSchema } from "../../route";

const zCreateOrganizationRequestSchema = RequestSchema({
  body: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
  }),
});
const zCreateOrganizationResponseSchema = ResponseSchema({
  data: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
});

const zInviteTeammateRequestSchema = RequestSchema({
  body: z.object({
    email: z.string().email(),
    role: z.enum(["admin", "member"]).default("member"),
  }),
  params: z.object({
    organizationId: z.string().uuid(),
  }),
});
const zInviteTeammateResponseSchema = ResponseSchema({
  data: z.object({
    id: z.string(),
    email: z.string(),
    status: z.string(),
  }),
});

@injectable()
export class OrganizationRoute extends HttpRoute {
  private readonly log: ILogger;

  constructor(
    @inject(INFRASTRUCTURE_SYMBOL.Logger) logger: ILogger,
    @inject(INFRASTRUCTURE_SYMBOL.Postgres)
    private readonly postgres: IPostgresPersistence,
  ) {
    super(logger);
    this.log = logger;
  }

  protected override setupRoutes(): void {
    this.register({
      method: HttpMethod.POST,
      path: "/",
      authenticated: true,
      requestSchema: zCreateOrganizationRequestSchema,
      responseSchema: zCreateOrganizationResponseSchema,
      handler: this.createOrganization.bind(this),
    });

    this.register({
      method: HttpMethod.POST,
      path: "/:organizationId/invitation",
      authenticated: true,
      requestSchema: zInviteTeammateRequestSchema,
      responseSchema: zInviteTeammateResponseSchema,
      handler: this.inviteTeammate.bind(this),
    });
  }

  private async createOrganization({
    authentication,
    data,
    response,
  }: RequestContext<
    typeof zCreateOrganizationRequestSchema,
    typeof zCreateOrganizationResponseSchema,
    true
  >) {
    const existingOrg =
      await this.postgres.client.query.organizationSchema.findFirst({
        where: ({ slug }, { eq }) => eq(slug, data.body.slug),
      });

    if (existingOrg) {
      return response.unsuccessful({
        code: HttpError.CONFLICT,
        message: "Organization with this slug already exists",
      });
    }

    const result = await this.postgres.client.transaction(async (tx) => {
      const [newOrg] = await tx
        .insert(organizationSchema)
        .values({
          name: data.body.name,
          slug: data.body.slug,
          createdAt: new Date(),
        })
        .returning({
          id: organizationSchema.id,
          name: organizationSchema.name,
          slug: organizationSchema.slug,
        });

      if (!newOrg) {
        throw new Error("Failed to create organization");
      }

      await tx.insert(memberSchema).values({
        organizationId: newOrg.id,
        userId: authentication.user.id,
        role: "admin",
        createdAt: new Date(),
      });

      return newOrg;
    });

    return response.success(result);
  }

  private async inviteTeammate({
    authentication,
    data,
    response,
  }: RequestContext<
    typeof zInviteTeammateRequestSchema,
    typeof zInviteTeammateResponseSchema,
    true
  >) {
    // Validate that the requester is an admin of this organization
    const membership = await this.postgres.client.query.memberSchema.findFirst({
      where: ({ organizationId, userId }) =>
        and(
          eq(organizationId, data.params.organizationId),
          eq(userId, authentication.user.id),
        ),
    });

    if (!membership || membership.role !== "admin") {
      return response.unsuccessful({
        code: HttpError.FORBIDDEN,
        message:
          "You do not have permission to invite teammates to this organization",
      });
    }

    // Fetch the organization name for use in the email
    const organization =
      await this.postgres.client.query.organizationSchema.findFirst({
        where: ({ id }) => eq(id, data.params.organizationId),
      });

    if (!organization) {
      return response.unsuccessful({
        code: HttpError.NOT_FOUND,
        message: "Organization not found",
      });
    }

    // Save the invitation record to the database
    const [newInvitation] = await this.postgres.client
      .insert(invitationSchema)
      .values({
        organizationId: data.params.organizationId,
        email: data.body.email,
        role: data.body.role,
        inviterId: authentication.user.id,
        status: "pending",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        createdAt: new Date(),
      })
      .returning({
        id: invitationSchema.id,
        email: invitationSchema.email,
        status: invitationSchema.status,
      });

    if (!newInvitation) {
      return response.unsuccessful({
        code: HttpError.INTERNAL_SERVER_ERROR,
        message: "Failed to create invitation",
      });
    }

    // Fire the invitation email. If it fails, we log the error but still return
    // success — the DB record exists and can be resent later.
    try {
      await sendInvitationEmail({
        toEmail: data.body.email,
        inviterName: authentication.user.name,
        organizationName: organization.name,
        invitationId: newInvitation.id,
        role: data.body.role,
      });
    } catch (emailError) {
      this.log.general.warn(
        { invitationId: newInvitation.id, error: emailError },
        "Invitation record created but failed to send email",
      );
    }

    return response.success(newInvitation);
  }
}
