import { LogLevel } from "@agenrix/logger";
import z from "zod";

export enum DeploymentType {
  HTTP = "http",
}
export enum NodeEnv {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}

const zEnvSchemaHttp = z.object({
  port: z.number().default(3001),
  baseUrl: z.url(),
  corsOrigins: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1)),
});

const zEnvSchemaPersistence = z.object({
  pg: z.object({
    url: z.url(),
  }),
  mongodb: z.object({
    url: z.url(),
    db: z.string(),
  }),
});

const zEnvSchemaAuthentication = z.object({
  secret: z.string(),
});

const zEnvSchemaWorker = z.object({
  baseUrl: z.url(),
});

const zEnvSchemaOAuth = z.object({
  github: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
  }),
});

const zEnvSchemaGithubIntegration = z.object({ appInstallationUrl: z.url() });

const zEnvSchemaIntegrations = z.object({
  github: zEnvSchemaGithubIntegration,
});

const zEnvSchemaEmail = z.object({
  resendApiKey: z.string(),
  fromAddress: z.string().email(),
});

export const zEnvSchema = z.object({
  name: z.string().default("@agenrix/api"),
  nodeEnv: z.enum(NodeEnv),
  deploymentType: z.enum(DeploymentType),
  logLevel: z.enum(LogLevel).default(LogLevel.INFO),
  http: zEnvSchemaHttp,
  persistence: zEnvSchemaPersistence,
  authentication: zEnvSchemaAuthentication,
  worker: zEnvSchemaWorker,
  oauth: zEnvSchemaOAuth,
  integrations: zEnvSchemaIntegrations,
  email: zEnvSchemaEmail,
});

export type IEnvSchema = z.infer<typeof zEnvSchema>;
