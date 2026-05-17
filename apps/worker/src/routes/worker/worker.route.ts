import { Hono } from "hono/tiny";
import z from "zod";
import { inngestClient } from "~/infrastructure/inngest/inngest.infrastructure";
import { analyzeRepositoryEvent } from "~/infrastructure/inngest/workflows/agent/repository-analysis.workflow";
import { generalLogger } from "~/infrastructure/logger/logger.infrastructure";
import { zGithubRepository } from "~/infrastructure/validation/atoms/github.atom";

const workerRoute = new Hono();

const zAnalyzeRepositoryBody = z.object({
  organizationId: z.uuid(),
  repository: zGithubRepository,
});

workerRoute.post("/", async (ctx) => {
  try {
    const body = await ctx.req.json().catch(() => null);

    const validationResult = zAnalyzeRepositoryBody.safeParse(body);

    if (!validationResult.success) {
      return ctx.json(
        {
          success: false,
          error: {
            message: validationResult.error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join("; "),
          },
        },
        400,
      );
    }

    const { ids } = await inngestClient.send(
      analyzeRepositoryEvent.create(validationResult.data),
    );

    return ctx.json({
      success: true,
      data: {
        eventId: ids,
      },
    });
  } catch (error) {
    generalLogger.error(
      {
        endpoint: `${ctx.req.method} ${new URL(ctx.req.url).pathname}`,
      },
      error instanceof Error ? error.message : "An unexpected error occurred",
    );

    return ctx.json({
      success: false,
      error: { message: "Something went wrong" },
    });
  }
});

export default workerRoute;
