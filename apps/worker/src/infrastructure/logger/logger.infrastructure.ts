import { createLogger } from "@agenrix/logger";
import { env } from "../config/env.config";

const parentLogger = createLogger({
  service: "@agenrix/worker",
  level: env.LOG_LEVEL,
  pretty: env.NODE_ENV === "development",
  redactPaths: [
    "req.headers.cookie",
    "req.headers.authorization",
    "req.headers.Cookie",
    "req.headers.Authorization",
  ],
});

export const generalLogger = parentLogger.child({ type: "general" });
export const httpLogger = parentLogger.child({ type: "http" });
