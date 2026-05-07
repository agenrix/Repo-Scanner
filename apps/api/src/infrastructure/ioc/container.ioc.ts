import { Container } from "inversify";
import RequestIdMiddleware from "~/cmd/http/middlewares/request-id.middleware";
import type { IHttpRoute } from "~/cmd/http/route";
import { BootstrapRouter, type IHttpRouter } from "~/cmd/http/router";
import { HealthRouter } from "~/cmd/http/routers/health.router";
import { HealthRoute } from "~/cmd/http/routes/system/health.route";
import { HttpServer, type IHttpServer } from "~/cmd/http/server";
import type { IHttpMiddleware } from "~/cmd/http/types";
import { type ILogger, Logger } from "../logger/logger.infrastructure";
import { HTTP_SYMBOL, INFRASTRUCTURE_SYMBOL } from "./symbols.ioc";

export const container = new Container({ defaultScope: "Singleton" });

// infrastructure
container.bind<ILogger>(INFRASTRUCTURE_SYMBOL.Logger).to(Logger);

// routes
container.bind<IHttpRoute>(HTTP_SYMBOL.Route.Health).to(HealthRoute);

// routers
container.bind<IHttpRouter>(HTTP_SYMBOL.Router.Bootstrap).to(BootstrapRouter);
container.bind<IHttpRouter>(HTTP_SYMBOL.Router.Health).to(HealthRouter);

// middlewares
container
  .bind<IHttpMiddleware>(HTTP_SYMBOL.Middleware.RequestId)
  .to(RequestIdMiddleware);

container.bind<IHttpServer>(HTTP_SYMBOL.Server).to(HttpServer);
