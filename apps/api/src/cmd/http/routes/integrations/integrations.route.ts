import type {
  ISelectIntegration,
  ISelectOrganization,
  ISelectUser,
} from "@agenrix/pg/schema";
import { inject, injectable } from "inversify";
import z from "zod";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import type { IPostgresPersistence } from "~/infrastructure/persistence/postgres.persistence";
import { zHttpGetIntegrations } from "~/infrastructure/validation/http/integration.http.validation";
import type { IzIntegrationResponse } from "~/infrastructure/validation/responses/integrations.response.validation";
import { HttpError, HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";
import { HttpRoute, type RequestContext, RequestSchema } from "../../route";

const zListIntegrationsRequestSchema = RequestSchema({
  params: z.object({ organizationId: z.string() }),
});
const zListIntegrationsResponseSchema = ResponseSchema({
  data: zHttpGetIntegrations,
});

@injectable()
export class IntegrationsRoute extends HttpRoute {
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
      path: "/:organizationId",
      authenticated: true,
      requestSchema: zListIntegrationsRequestSchema,
      responseSchema: zListIntegrationsResponseSchema,
      handler: this.listIntegrations.bind(this),
    });
  }

  private async listIntegrations({
    data,
    authentication,
    response,
  }: RequestContext<
    typeof zListIntegrationsRequestSchema,
    typeof zListIntegrationsResponseSchema,
    true
  >) {
    const membership = await this.postgres.client.query.memberSchema.findFirst({
      where: ({ organizationId, userId }, { eq, and }) =>
        and(
          eq(organizationId, data.params.organizationId),
          eq(userId, authentication.user.id),
        ),
    });

    if (!membership) {
      return response.unsuccessful({
        code: HttpError.NOT_FOUND,
        message: "Organization not found",
      });
    }

    const integrations =
      await this.postgres.client.query.integrationsSchema.findMany({
        where: ({ organizationId }, { eq }) =>
          eq(organizationId, data.params.organizationId),
        with: { connectedBy: true, organization: true },
      });

    return response.success({
      integrations: integrations.map((integration) =>
        this.serializeIntegration(
          integration,
          integration.organization,
          integration.connectedBy,
        ),
      ),
    });
  }

  private serializeIntegration(
    integration: ISelectIntegration,
    organization: ISelectOrganization,
    connectedBy: ISelectUser,
  ): IzIntegrationResponse {
    return {
      id: integration.id,
      appName: integration.appName,
      connectedBy: {
        id: connectedBy.id,
        email: connectedBy.email,
        image: connectedBy.image,
        name: connectedBy.name,
      },
      organizationId: {
        id: organization.id,
        slug: organization.slug,
        logo: organization.logo,
        createdAt: organization.createdAt,
        name: organization.name,
      },
    };
  }
}
