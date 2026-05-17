import { and, count, desc, eq } from "@agenrix/pg/orm";
import { agentSchema } from "@agenrix/pg/schema";
import { inject, injectable } from "inversify";
import z from "zod";
import { env } from "~/infrastructure/config/env.config";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import type { IPostgresPersistence } from "~/infrastructure/persistence/postgres.persistence";
import { HttpError, HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";
import { HttpRoute, type RequestContext, RequestSchema } from "../../route";

const zTriggerRepositoryScanRequestSchema = RequestSchema({
  body: z.object({ organizationId: z.uuid(), repository: z.url() }),
});
const zTriggerRepositoryScanResponseSchema = ResponseSchema({
  data: z.object({ eventId: z.array(z.string()) }),
});

const zWorkerTriggerResponse = z.object({
  success: z.literal(true),
  data: z.object({ eventId: z.array(z.string()) }),
});

function getGithubRepositoryMetadata(repository: string) {
  const url = new URL(repository);
  const [owner, repoSegment] = url.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/");
  const repoName = repoSegment?.replace(/\.git$/, "");

  if (!owner || !repoName) {
    return null;
  }

  return {
    repoId: `${owner}/${repoName}`,
    repoName,
  };
}

const zAgentListItem = z.object({
  id: z.string(),
  organizationId: z.string(),
  repoId: z.string(),
  repoName: z.string(),
  repoLink: z.url(),
  classification: z.enum(["AGENT", "POSSIBLE_AGENT", "NOT_AGENT"]).nullable(),
  confidence: z.enum(["high", "medium", "low"]).nullable(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]),
  agentSignals: z.array(z.string()),
  evidenceFiles: z.array(z.string()),
  frameworksDetected: z.array(z.string()),
  reasoning: z.string().nullable(),
  agentId: z.string().nullable(),
  agentName: z.string().nullable(),
  agentDescription: z.string().nullable(),
  agentOwner: z.string().nullable(),
  agentContributors: z.array(z.string()),
  agentAccessRights: z.unknown().nullable(),
  agentIntegrationDetails: z.unknown().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const zListRepositoryScansRequestSchema = RequestSchema({
  query: z.object({
    organizationId: z.uuid(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});
const zListRepositoryScansResponseSchema = ResponseSchema({
  data: z.object({
    agents: z.array(zAgentListItem),
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
  }),
});

const zRepoScanWebhookRequestSchema = RequestSchema({
  body: z.object({
    repo: z.object({
      organization_id: z.uuid(),
      repo_id: z.string(),
      repo_name: z.string(),
      repo_link: z.url(),
      classification: z.enum(["AGENT", "POSSIBLE_AGENT", "NOT_AGENT"]),
      confidence: z.enum(["high", "medium", "low"]),
      agent_signals: z.array(z.string()).default([]),
      evidence_files: z.array(z.string()).default([]),
      frameworks_detected: z.array(z.string()).default([]),
      reasoning: z.string(),
    }),
    agent: z
      .object({
        agent_id: z.string(),
        agent_name: z.string().nullable().optional(),
        agent_description: z.string().nullable().optional(),
        owner: z.string().nullable().optional(),
        contributors: z.array(z.string()).default([]),
        access_rights: z
          .object({
            files: z.array(z.string()).default([]),
            tools: z.array(z.string()).default([]),
            data_nodes: z.array(z.string()).default([]),
            apis: z.array(z.string()).default([]),
            servers: z.array(z.string()).default([]),
          })
          .optional(),
        integration_details: z
          .object({
            apis: z.array(z.string()).default([]),
            tools: z.array(z.string()).default([]),
            frameworks: z.array(z.string()).default([]),
          })
          .optional(),
      })
      .optional(),
  }),
});
const zRepoScanWebhookResponseSchema = ResponseSchema({
  data: z.object({
    id: z.string(),
    repoId: z.string(),
    status: z.literal("COMPLETED"),
  }),
});

@injectable()
export class RepoScansRoute extends HttpRoute {
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
      authenticated: true,
      requestSchema: zListRepositoryScansRequestSchema,
      responseSchema: zListRepositoryScansResponseSchema,
      handler: this.listRepositoryScans.bind(this),
    });

    this.register({
      method: HttpMethod.POST,
      path: "/scan",
      authenticated: true,
      requestSchema: zTriggerRepositoryScanRequestSchema,
      responseSchema: zTriggerRepositoryScanResponseSchema,
      handler: this.triggerRepositoryScan.bind(this),
    });

    this.register({
      method: HttpMethod.POST,
      path: "/",
      authenticated: false,
      requestSchema: zRepoScanWebhookRequestSchema,
      responseSchema: zRepoScanWebhookResponseSchema,
      handler: this.receiveRepositoryScan.bind(this),
    });
  }

  private async listRepositoryScans({
    authentication,
    data,
    response,
  }: RequestContext<
    typeof zListRepositoryScansRequestSchema,
    typeof zListRepositoryScansResponseSchema,
    true
  >) {
    const membership = await this.postgres.client.query.memberSchema.findFirst({
      where: ({ organizationId, userId }) =>
        and(
          eq(organizationId, data.query.organizationId),
          eq(userId, authentication.user.id),
        ),
    });

    if (!membership) {
      return response.unsuccessful({
        code: HttpError.NOT_FOUND,
        message: "Organization not found",
      });
    }

    const where = eq(agentSchema.organizationId, data.query.organizationId);
    const [totalResult] = await this.postgres.client
      .select({ total: count() })
      .from(agentSchema)
      .where(where);
    const agents = await this.postgres.client.query.agentSchema.findMany({
      where: ({ organizationId }) =>
        eq(organizationId, data.query.organizationId),
      orderBy: ({ createdAt }) => desc(createdAt),
      limit: data.query.limit,
      offset: data.query.offset,
    });

    return response.success({
      agents,
      total: totalResult?.total ?? 0,
      limit: data.query.limit,
      offset: data.query.offset,
    });
  }

  private async triggerRepositoryScan({
    authentication,
    data,
    response,
  }: RequestContext<
    typeof zTriggerRepositoryScanRequestSchema,
    typeof zTriggerRepositoryScanResponseSchema,
    true
  >) {
    const membership = await this.postgres.client.query.memberSchema.findFirst({
      where: ({ organizationId, userId }) =>
        and(
          eq(organizationId, data.body.organizationId),
          eq(userId, authentication.user.id),
        ),
    });

    if (!membership) {
      return response.unsuccessful({
        code: HttpError.NOT_FOUND,
        message: "Organization not found",
      });
    }

    const repositoryMetadata = getGithubRepositoryMetadata(
      data.body.repository,
    );

    if (!repositoryMetadata) {
      return response.unsuccessful({
        code: HttpError.BAD_REQUEST,
        message: "Invalid github repository url",
      });
    }

    await this.postgres.client
      .insert(agentSchema)
      .values({
        organizationId: data.body.organizationId,
        repoId: repositoryMetadata.repoId,
        repoName: repositoryMetadata.repoName,
        repoLink: data.body.repository,
        status: "PENDING",
        agentSignals: [],
        evidenceFiles: [],
        frameworksDetected: [],
        agentContributors: [],
      })
      .onConflictDoUpdate({
        target: [agentSchema.organizationId, agentSchema.repoId],
        set: {
          repoName: repositoryMetadata.repoName,
          repoLink: data.body.repository,
          status: "PENDING",
          classification: null,
          confidence: null,
          reasoning: null,
          agentSignals: [],
          evidenceFiles: [],
          frameworksDetected: [],
          agentId: null,
          agentName: null,
          agentDescription: null,
          agentOwner: null,
          agentContributors: [],
          agentAccessRights: null,
          agentIntegrationDetails: null,
        },
      });

    const workerResponse = await fetch(`${env.worker.baseUrl}/v1/worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.body),
    });
    const workerBody = await workerResponse.json().catch(() => null);

    if (!workerResponse.ok) {
      return response.unsuccessful({
        code: HttpError.BAD_GATEWAY,
        message: "Worker rejected repository scan request",
        detail: workerBody,
      });
    }

    const workerResult = zWorkerTriggerResponse.safeParse(workerBody);

    if (!workerResult.success) {
      return response.unsuccessful({
        code: HttpError.BAD_GATEWAY,
        message: "Worker returned an invalid response",
        detail: workerResult.error.message,
      });
    }

    return response.success(workerResult.data.data);
  }

  private async receiveRepositoryScan({
    data,
    response,
  }: RequestContext<
    typeof zRepoScanWebhookRequestSchema,
    typeof zRepoScanWebhookResponseSchema,
    false
  >) {
    const { repo, agent } = data.body;
    const agentValues = {
      organizationId: repo.organization_id,
      repoId: repo.repo_id,
      repoName: repo.repo_name,
      repoLink: repo.repo_link,
      classification: repo.classification,
      confidence: repo.confidence,
      status: "COMPLETED" as const,
      agentSignals: repo.agent_signals,
      evidenceFiles: repo.evidence_files,
      frameworksDetected: repo.frameworks_detected,
      reasoning: repo.reasoning,
      agentId: agent?.agent_id ?? null,
      agentName: agent?.agent_name ?? null,
      agentDescription: agent?.agent_description ?? null,
      agentOwner: agent?.owner ?? null,
      agentContributors: agent?.contributors ?? [],
      agentAccessRights: agent?.access_rights ?? null,
      agentIntegrationDetails: agent?.integration_details ?? null,
    };

    const [savedAgent] = await this.postgres.client
      .insert(agentSchema)
      .values(agentValues)
      .onConflictDoUpdate({
        target: [agentSchema.organizationId, agentSchema.repoId],
        set: agentValues,
      })
      .returning({
        id: agentSchema.id,
        repoId: agentSchema.repoId,
        status: agentSchema.status,
      });

    if (!savedAgent) {
      return response.unsuccessful({
        code: HttpError.INTERNAL_SERVER_ERROR,
        message: "Failed to save repository scan",
      });
    }

    return response.success({
      id: savedAgent.id,
      repoId: savedAgent.repoId,
      status: "COMPLETED",
    });
  }
}
