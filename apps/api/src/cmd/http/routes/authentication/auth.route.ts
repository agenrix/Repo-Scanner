import crypto from "node:crypto";
import { accountSchema, sessionSchema, userSchema } from "@agenrix/pg/schema";
import { and, eq } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { inject, injectable } from "inversify";
import z from "zod";
import {
  HttpRoute,
  type RequestContext,
  RequestSchema,
} from "~/cmd/http/route";
import { env } from "~/infrastructure/config/env.config";
import { INFRASTRUCTURE_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { ILogger } from "~/infrastructure/logger/logger.infrastructure";
import type { IPostgresPersistence } from "~/infrastructure/persistence/postgres.persistence";
import { HttpMethod } from "~/shared/types/http.types";
import { ResponseSchema } from "~/shared/utils/response.utils";

const zCallbackRequestSchema = RequestSchema({
  query: z.object({ code: z.string().optional() }),
});
const zSessionResponseSchema = ResponseSchema({
  data: z.any(),
});
const zSignOutResponseSchema = ResponseSchema({
  data: z.null(),
});

@injectable()
export class AuthenticationRootRoute extends HttpRoute {
  constructor(
    @inject(INFRASTRUCTURE_SYMBOL.Logger) logger: ILogger,
    @inject(INFRASTRUCTURE_SYMBOL.Postgres)
    private readonly postgres: IPostgresPersistence,
  ) {
    super(logger);
  }

  protected override setupRoutes(): void {
    this.register({
      method: HttpMethod.GET,
      path: "/sign-in/github",
      authenticated: false,
      requestSchema: RequestSchema(),
      responseSchema: ResponseSchema(),
      handler: this.signInGithub.bind(this),
    });

    this.register({
      method: HttpMethod.GET,
      path: "/callback/github",
      authenticated: false,
      requestSchema: zCallbackRequestSchema,
      responseSchema: ResponseSchema(),
      handler: this.callbackGithub.bind(this),
    });

    this.register({
      method: HttpMethod.GET,
      path: "/get-session",
      authenticated: false,
      requestSchema: RequestSchema(),
      responseSchema: zSessionResponseSchema,
      handler: this.getSession.bind(this),
    });

    this.register({
      method: HttpMethod.POST,
      path: "/sign-out",
      authenticated: false,
      requestSchema: RequestSchema(),
      responseSchema: zSignOutResponseSchema,
      handler: this.signOut.bind(this),
    });
  }

  private async signInGithub({
    ctx,
  }: RequestContext<
    ReturnType<typeof RequestSchema>,
    ReturnType<typeof ResponseSchema>,
    false
  >) {
    const clientId = env.oauth.github.clientId;
    const redirectUri = `${env.http.baseUrl}/v1/authentication/callback/github`;
    const scopes = encodeURIComponent("read:user user:email");
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}`;
    return ctx.redirect(url);
  }

  private async callbackGithub({
    ctx,
    data,
    logger,
  }: RequestContext<
    typeof zCallbackRequestSchema,
    ReturnType<typeof ResponseSchema>,
    false
  >) {
    const code = data.query.code;
    if (!code) {
      return ctx.text("Authentication failed: Missing code", 400);
    }

    try {
      // 1. Exchange code for access token
      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: env.oauth.github.clientId,
            client_secret: env.oauth.github.clientSecret,
            code,
            redirect_uri: `${env.http.baseUrl}/v1/authentication/callback/github`,
          }),
        },
      );

      const tokenData = (await tokenResponse.json()) as {
        error?: string;
        error_description?: string;
        access_token?: string;
      };
      if (tokenData.error) {
        logger.error({ error: tokenData }, "GitHub token error");
        return ctx.text(
          `Authentication failed: ${tokenData.error_description || "Invalid code"}`,
          400,
        );
      }

      const accessToken = tokenData.access_token;

      // 2. Fetch User Profile
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "Agenrix-Auth",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      const githubUser = (await userResponse.json()) as {
        id?: number;
        name?: string;
        login: string;
        avatar_url?: string;
      };

      if (!githubUser?.id) {
        logger.error({ githubUser }, "Failed to fetch GitHub user profile");
        return ctx.text(
          "Authentication failed: Could not retrieve GitHub profile",
          400,
        );
      }

      // 3. Fetch User Emails
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "Agenrix-Auth",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      const githubEmails = (await emailsResponse.json()) as
        | { email: string; primary: boolean }[]
        | unknown;
      const primaryEmail = Array.isArray(githubEmails)
        ? githubEmails.find((e) => e.primary)?.email || githubEmails[0]?.email
        : null;

      if (!primaryEmail) {
        logger.error(
          { githubEmails, githubUser },
          "Failed to fetch GitHub emails or no email found",
        );
        return ctx.text(
          `Authentication failed: No email found. GitHub responded with: ${JSON.stringify(githubEmails)} | Profile: ${JSON.stringify(githubUser)}`,
          400,
        );
      }

      // 4. DB Logic: Find or Create User & Account
      const db = this.postgres.client;

      // Look for existing account
      const existingAccount = await db
        .select()
        .from(accountSchema)
        .where(
          and(
            eq(accountSchema.providerId, "github"),
            eq(accountSchema.accountId, String(githubUser.id)),
          ),
        )
        .limit(1)
        .then((res) => res[0]);

      let userId: string;

      if (existingAccount) {
        userId = existingAccount.userId;
        // Update user details if needed
        await db
          .update(userSchema)
          .set({
            name: githubUser.name || githubUser.login,
            image: githubUser.avatar_url,
          })
          .where(eq(userSchema.id, userId));
      } else {
        // Look for existing user by email
        const existingUser = await db
          .select()
          .from(userSchema)
          .where(eq(userSchema.email, primaryEmail))
          .limit(1)
          .then((res) => res[0]);

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create new user
          const inserted = await db
            .insert(userSchema)
            .values({
              id: crypto.randomUUID(),
              name: githubUser.name || githubUser.login,
              email: primaryEmail,
              emailVerified: true,
              image: githubUser.avatar_url,
            })
            .returning();
          if (!inserted[0]) throw new Error("Failed to create user");
          userId = inserted[0].id;
        }

        // Create linked account
        await db.insert(accountSchema).values({
          id: crypto.randomUUID(),
          userId,
          accountId: String(githubUser.id),
          providerId: "github",
          accessToken,
        });
      }

      // 5. Create Session
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      await db.insert(sessionSchema).values({
        id: crypto.randomUUID(),
        userId,
        token: sessionToken,
        expiresAt,
        ipAddress: ctx.req.header("x-forwarded-for") || undefined,
        userAgent: ctx.req.header("user-agent") || undefined,
      });

      // 6. Set Cookie & Redirect
      setCookie(ctx, "session_token", sessionToken, {
        path: "/",
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        expires: expiresAt,
      });

      const frontendUrl = env.http.corsOrigins[0] || "http://localhost:3002";
      return ctx.redirect(frontendUrl);
    } catch (err) {
      const error = err as Error & Record<string, unknown>;
      const errPayload = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
        table: error.table,
        column: error.column,
        cause:
          error.cause instanceof Error
            ? { message: error.cause.message, stack: error.cause.stack }
            : undefined,
      };
      logger.error({ error: errPayload }, "OAuth callback error");
      return ctx.text(
        `Internal Server Error: ${JSON.stringify(errPayload)}`,
        500,
      );
    }
  }

  private async getSession({
    ctx,
    response,
  }: RequestContext<
    ReturnType<typeof RequestSchema>,
    typeof zSessionResponseSchema,
    false
  >) {
    const token = getCookie(ctx, "session_token");
    if (!token) return response.success({ session: null, user: null });

    const db = this.postgres.client;

    // Join session and user
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
      deleteCookie(ctx, "session_token");
      return response.success({ session: null, user: null });
    }

    return response.success(result);
  }

  private async signOut({
    ctx,
    response,
  }: RequestContext<
    ReturnType<typeof RequestSchema>,
    typeof zSignOutResponseSchema,
    false
  >) {
    const token = getCookie(ctx, "session_token");
    if (token) {
      const session = await this.postgres.client
        .select()
        .from(sessionSchema)
        .where(eq(sessionSchema.token, token))
        .limit(1)
        .then((res) => res[0]);
      if (session) {
        await this.postgres.client
          .delete(sessionSchema)
          .where(eq(sessionSchema.userId, session.userId));
      }
      deleteCookie(ctx, "session_token", { path: "/" });
    }
    return response.success(null);
  }
}
