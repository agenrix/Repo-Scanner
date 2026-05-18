import type { LogLevel } from "@agenrix/logger";
import { validate } from "~/shared/utils/zod.utils";
import {
  type DeploymentType,
  type IEnvSchema,
  type NodeEnv,
  zEnvSchema,
} from "../validation/env.validation";

export const env: IEnvSchema = validate(zEnvSchema, {
  name: process.env.APP_NAME,
  nodeEnv: process.env.NODE_ENV as NodeEnv,
  deploymentType: process.env.DEPLOYMENT_TYPE as DeploymentType,
  logLevel:
    process.env.LOG_LEVEL !== undefined
      ? (process.env.LOG_LEVEL as LogLevel)
      : undefined,
  http: {
    port: process.env.PORT !== undefined ? Number(process.env.PORT) : undefined,
    baseUrl: process.env.BASE_URL as string,
    corsOrigins: process.env.CORS_ORIGINS as string,
  },
  authentication: {
    secret: process.env.AUTH_SECRET as string,
  },
  worker: {
    baseUrl: process.env.WORKER_BASE_URL as string,
  },
  oauth: {
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET as string,
    },
  },
  integrations: {
    github: {
      appInstallationUrl: process.env.GITHUB_APP_INSTALLATION_URL as string,
    },
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY as string,
    fromAddress: process.env.EMAIL_FROM_ADDRESS as string,
  },
  persistence: {
    pg: {
      url: process.env.POSTGRES_URL as string,
    },
    mongodb: {
      url: process.env.MONGODB_URI as string,
      db: process.env.MONGODB_DB as string,
    },
  },
});
