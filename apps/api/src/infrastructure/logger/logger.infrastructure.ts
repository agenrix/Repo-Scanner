import { createLogger, type LogLevel, type PinoLogger } from "@agenrix/logger";
import { injectable } from "inversify";
import { env } from "../config/env.config";
import { NodeEnv } from "../validation/env.validation";

export interface ILogger {
  init(level: LogLevel): Promise<void>;
  readonly general: PinoLogger;
  readonly http: PinoLogger;
}

@injectable()
export class Logger implements ILogger {
  private parentLogger!: PinoLogger;
  private generalLogger!: PinoLogger;
  private httpLogger!: PinoLogger;

  async init(level: LogLevel): Promise<void> {
    this.parentLogger = createLogger({
      service: env.name,
      level,
      pretty: env.nodeEnv === NodeEnv.DEVELOPMENT,
      redactPaths: [
        "req.headers.cookie",
        "req.headers.authorization",
        "req.headers.Cookie",
        "req.headers.Authorization",
      ],
    });

    this.generalLogger = this.parentLogger.child({ type: "general" });
    this.httpLogger = this.parentLogger.child({ type: "http" });
  }

  get general(): PinoLogger {
    return this.generalLogger;
  }
  get http(): PinoLogger {
    return this.httpLogger;
  }
}
