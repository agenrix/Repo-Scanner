import type { Context, Hono, MiddlewareHandler } from "hono";

export type IHttpVariables = {
  requestId: string;
  authentication: {
    session: unknown;
    user: unknown;
  } | null;
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
