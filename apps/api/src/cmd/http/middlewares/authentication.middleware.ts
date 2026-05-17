import { injectable } from "inversify";
import { authentication } from "~/infrastructure/config/better-auth.config";
import type { IHttpMiddleware, IHttpMiddlewareHandler } from "../types";

const PUBLIC_PATHS = [
  "/v1/authentication",
  "/v1/integrations/github/callback",
] as const;

@injectable()
export default class AuthenticationMiddleware implements IHttpMiddleware {
  async init(): Promise<IHttpMiddlewareHandler> {
    return async (ctx, next) => {
      if (PUBLIC_PATHS.some((path) => ctx.req.path.startsWith(path))) {
        ctx.set("authentication", null);
        return await next();
      }

      const authenticationResult = await authentication.api.getSession({
        headers: ctx.req.raw.headers,
      });
      const session = authenticationResult?.session
        ? authenticationResult
        : null;

      ctx.set("authentication", session);

      return await next();
    };
  }
}
