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

const zEnvSchemaOAuth = z.object({
  github: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
  }),
});

export const zEnvSchema = z.object({
  name: z.string().default("@agenrix/api"),
  nodeEnv: z.enum(NodeEnv),
  deploymentType: z.enum(DeploymentType),
  logLevel: z.enum(LogLevel).default(LogLevel.INFO),
  http: zEnvSchemaHttp,
  persistence: zEnvSchemaPersistence,
  authentication: zEnvSchemaAuthentication,
  oauth: zEnvSchemaOAuth,
});

export type IEnvSchema = z.infer<typeof zEnvSchema>;
