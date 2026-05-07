import { injectable } from "inversify";
import { ulid } from "ulid";
import type { IHttpMiddleware, IHttpMiddlewareHandler } from "../types";

@injectable()
export default class RequestIdMiddleware implements IHttpMiddleware {
  async init(): Promise<IHttpMiddlewareHandler> {
    return async (ctx, next) => {
      const requestId = ulid();
      ctx.set("requestId", requestId);

      ctx.header("X-Request-Id", requestId);

      await next();
    };
  }
}
