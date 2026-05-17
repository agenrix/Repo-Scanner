import { cors } from "hono/cors";
import { Hono } from "hono/tiny";
import { pinoLogger } from "hono-pino";
import { serve } from "inngest/hono";
import { env } from "./infrastructure/config/env.config";
import { inngestClient } from "./infrastructure/inngest/inngest.infrastructure";
import { repositoryAnalysisWorkflow } from "./infrastructure/inngest/workflows/agent/repository-analysis.workflow";
import {
  generalLogger,
  httpLogger,
} from "./infrastructure/logger/logger.infrastructure";
import { setupMiddleware } from "./middlewares/setup.middleware";
import router from "./router";

const app = new Hono();

app.use("*", cors());
app.use("*", setupMiddleware);
app.use(
  "/v1/*",
  pinoLogger({ pino: httpLogger, http: { referRequestIdKey: "requestId" } }),
);

app.route("/v1", router);

app.on(
  ["GET", "POST", "PUT"],
  "/api/inngest",
  serve({ client: inngestClient, functions: [repositoryAnalysisWorkflow] }),
);

const server = Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
  hostname: "0.0.0.0",
});

generalLogger.info(
  `Server listening on http://${server.hostname}:${server.port}`,
);
