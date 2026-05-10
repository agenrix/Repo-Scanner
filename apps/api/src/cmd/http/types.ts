import type { Context, Hono, MiddlewareHandler } from "hono";
import type { IAuthentication } from "~/infrastructure/config/better-auth.config";

export type IHttpVariables = {
  reqId: string;
  authentication: IAuthentication["Session"] | null;
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
