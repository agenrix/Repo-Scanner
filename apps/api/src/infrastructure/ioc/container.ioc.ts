import { Container } from "inversify";
import AuthenticationMiddleware from "~/cmd/http/middlewares/authentication.middleware";
import RequestIdMiddleware from "~/cmd/http/middlewares/request-id.middleware";
import type { IHttpRoute } from "~/cmd/http/route";
import { BootstrapRouter, type IHttpRouter } from "~/cmd/http/router";
import { UserRouter } from "~/cmd/http/routers/user.router";
import { UserProfileRoute } from "~/cmd/http/routes/user/session.user.route";
import { HttpServer, type IHttpServer } from "~/cmd/http/server";
import type { IHttpMiddleware } from "~/cmd/http/types";
import { type ILogger, Logger } from "../logger/logger.infrastructure";
import {
  type IPostgresPersistence,
  PostgresPersistence,
} from "../persistence/postgres.persistence";
import { HTTP_SYMBOL, INFRASTRUCTURE_SYMBOL } from "./symbols.ioc";

export const container = new Container({ defaultScope: "Singleton" });

// infrastructure
container.bind<ILogger>(INFRASTRUCTURE_SYMBOL.Logger).to(Logger);
container
  .bind<IPostgresPersistence>(INFRASTRUCTURE_SYMBOL.Postgres)
  .to(PostgresPersistence);

// routes
container
  .bind<IHttpRoute>(HTTP_SYMBOL.Route.User.Authentication)
  .to(UserProfileRoute);

// routers
container.bind<IHttpRouter>(HTTP_SYMBOL.Router.Bootstrap).to(BootstrapRouter);
container.bind<IHttpRouter>(HTTP_SYMBOL.Router.User).to(UserRouter);

// middlewares
container
  .bind<IHttpMiddleware>(HTTP_SYMBOL.Middleware.RequestId)
  .to(RequestIdMiddleware);
container
  .bind<IHttpMiddleware>(HTTP_SYMBOL.Middleware.Authentication)
  .to(AuthenticationMiddleware);

container.bind<IHttpServer>(HTTP_SYMBOL.Server).to(HttpServer);
