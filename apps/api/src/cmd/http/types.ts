import type { Context, Hono, MiddlewareHandler } from "hono";
import type { Authentication } from "~/infrastructure/config/better-auth.config";

export type IHttpVariables = {
  requestId: string;
  authentication: Authentication["$Infer"]["Session"] | null;
};

export type IHttpBindings = {
  Variables: IHttpVariables;
};

export type IHttpApp = Hono<IHttpBindings>;
export type IHttpContext = Context<IHttpBindings>;
export type IHttpMiddlewareHandler = MiddlewareHandler<IHttpBindings>;

export interface IHttpMiddleware {
  init(): Promise<IHttpMiddlewareHandler>;
}
