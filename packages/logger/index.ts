import pino from "pino";

export interface ICreateLoggerParams {
  service: string;
  level: LogLevel;
  redactPaths?: readonly string[];
  pretty?: boolean;
}

export enum LogLevel {
  FATAL = "fatal",
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
  TRACE = "trace",
}

export type PinoLogger = pino.Logger;

export const createLogger = ({
  level,
  service,
  redactPaths = [],
  pretty = false,
}: ICreateLoggerParams) =>
  pino({
    name: service,
    level,
    redact: {
      paths: [...redactPaths],
      censor: "[REDACTED]",
    },
    transport: pretty
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  });
