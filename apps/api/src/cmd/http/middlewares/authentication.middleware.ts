import { sessionSchema, userSchema } from "@agenrix/pg/schema";
import { eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { inject, injectable } from "inversify";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { IPostgresPersistence } from "~/infrastructure/persistence/postgres.persistence";
import type { IHttpMiddleware, IHttpMiddlewareHandler } from "../types";

const PUBLIC_PATHS = [
  "/v1/authentication",
  "/v1/integrations/github/callback",
] as const;

@injectable()
export default class AuthenticationMiddleware implements IHttpMiddleware {
  constructor(
    @inject(INFRASTRUCTURE_SYMBOL.Postgres)
    private readonly postgres: IPostgresPersistence,
  ) {}

  async init(): Promise<IHttpMiddlewareHandler> {
    return async (ctx, next) => {
      if (PUBLIC_PATHS.some((path) => ctx.req.path.startsWith(path))) {
        ctx.set("authentication", null);
        return await next();
      }

      const token = getCookie(ctx, "session_token");
      if (!token) {
        ctx.set("authentication", null);
        return await next();
      }

      const db = this.postgres.client;
      const result = await db
        .select({
          session: sessionSchema,
          user: userSchema,
        })
        .from(sessionSchema)
        .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
        .where(eq(sessionSchema.token, token))
        .limit(1)
        .then((res) => res[0]);

      if (!result || result.session.expiresAt < new Date()) {
        ctx.set("authentication", null);
      } else {
        ctx.set("authentication", result);
      }

      return await next();
    };
  }
}
