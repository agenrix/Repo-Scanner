import {
  githubCredentialsSchema,
  integrationsSchema,
} from "@agenrix/pg/schema";
import { inject, injectable } from "inversify";
import z from "zod";
import {
  HttpRoute,
  type RequestContext,
  RequestSchema,
} from "~/cmd/http/route";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import type { IPostgresPersistence } from "~/infrastructure/persistence/postgres.persistence";
import { HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";

const zCallbackRequestSchema = RequestSchema({
  query: z.object({ installation_id: z.string(), state: z.string() }),
});
const zCallbackResponseSchema = ResponseSchema({ data: z.null() });

const zCallbackStateSchema = z.object({
  redirectUri: z.url(),
  organizationId: z.uuid(),
  userId: z.uuid(),
});

@injectable()
export class GithubIntegrationCallbackRoute extends HttpRoute {
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
    const state = zCallbackStateSchema.parse(
      JSON.parse(Buffer.from(data.query.state, "base64url").toString("utf8")),
    );

    logger.info(
      {
        installationId: data.query.installation_id,
        organizationId: state.organizationId,
      },
      `Received callback for Github integration`,
    );

    await this.postgres.client.transaction(async (tx) => {
      const [credential] = await tx
        .insert(githubCredentialsSchema)
        .values({ installationId: data.query.installation_id })
        .onConflictDoUpdate({
          target: githubCredentialsSchema.installationId,
          set: { updatedAt: new Date() },
        })
        .returning({ id: githubCredentialsSchema.id });

      if (!credential) {
        throw new Error("Failed to create GitHub credentials");
      }

      await tx
        .insert(integrationsSchema)
        .values({
          appName: "github",
          organizationId: state.organizationId,
          connectedBy: state.userId,
          credentialId: credential.id,
        })
        .onConflictDoUpdate({
          target: [
            integrationsSchema.organizationId,
            integrationsSchema.appName,
          ],
          set: {
            connectedBy: state.userId,
            credentialId: credential.id,
            updatedAt: new Date(),
          },
        });
    });

    return response.redirect(new URL(state.redirectUri));
  }
}
