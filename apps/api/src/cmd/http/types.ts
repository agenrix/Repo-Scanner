import type { Context, Hono, MiddlewareHandler } from "hono";
import type { authentication } from "~/infrastructure/config/better-auth.config";

export type IHttpVariables = {
  requestId: string;
  authentication: typeof authentication.$Infer.Session | null;
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
