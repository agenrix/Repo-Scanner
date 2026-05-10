import { injectable } from "inversify";
import { authentication } from "~/infrastructure/config/better-auth.config";
import type { IHttpMiddleware, IHttpMiddlewareHandler } from "../types";

@injectable()
export default class AuthenticationMiddleware implements IHttpMiddleware {
  async init(): Promise<IHttpMiddlewareHandler> {
    return async (ctx, next) => {
      const authenticationResult = await authentication.api.getSession({
        headers: ctx.req.raw.headers,
      });

      ctx.set(
        "authentication",
        authenticationResult?.session ? authenticationResult : null,
      );

      return await next();
    };
  }
}
