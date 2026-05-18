import type { ISelectSession, ISelectUser } from "@agenrix/pg/schema";
import type { Context, Hono, MiddlewareHandler } from "hono";

export type IHttpVariables = {
  reqId: string;
  authentication: {
    session: ISelectSession;
    user: ISelectUser;
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
