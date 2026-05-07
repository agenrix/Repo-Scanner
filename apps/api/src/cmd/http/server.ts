import { Hono } from "hono";
import { cors } from "hono/cors";
import { pinoLogger } from "hono-pino";
import { inject, injectable } from "inversify";
import { authentication } from "~/infrastructure/config/better-auth.config";
import { env } from "~/infrastructure/config/env.config";
import {
  HTTP_SYMBOL,
  INFRASTRUCTURE_SYMBOL,
} from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import type { IHttpRouter } from "./router";
import type { IHttpApp, IHttpMiddleware } from "./types";

export interface IHttpServer {
  init(): Promise<void>;
}

@injectable()
export class HttpServer implements IHttpServer {
  constructor(
    @inject(INFRASTRUCTURE_SYMBOL.Logger)
    private readonly logger: ILogger,

    @inject(HTTP_SYMBOL.Router.Bootstrap)
    private readonly router: IHttpRouter,

    @inject(HTTP_SYMBOL.Middleware.RequestId)
    private readonly requestIdMiddleware: IHttpMiddleware,
  ) {}

  async init(): Promise<void> {
    this.logger.init(env.logLevel);
    this.logger.general.info("Initializing server...");

    const app: IHttpApp = new Hono();

    await this.setupMiddlewares(app);

    app.on(
      ["GET", "POST"],
      "/v1/authentication/*",
      async (c) => await authentication.handler(c.req.raw),
    );

    await this.router.init("/v1", app);
    await this.start(app);
  }

  private async setupMiddlewares(app: IHttpApp) {
    app.use(
      "*",
      cors({
        origin: (origin) =>
          env.http.corsOrigins.includes(origin) ? origin : null,
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
      }),
    );

    app.use("*", await this.requestIdMiddleware.init());

    app.use(
      "*",
      pinoLogger({
        pino: this.logger.http,
        http: {
          referRequestIdKey: "requestId",
        },
      }),
    );
  }

  private async start(app: IHttpApp): Promise<void> {
    const server = Bun.serve({
      fetch: app.fetch,
      port: env.http.port,
      hostname: "0.0.0.0",
    });

    this.logger.general.info(
      `Server listening on http://${server.hostname}:${server.port}`,
    );
  }
}
