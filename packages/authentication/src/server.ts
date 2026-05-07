import { pg } from "@agenrix/pg";
import {
  accountSchema,
  sessionSchema,
  userSchema,
  verificationSchema,
} from "@agenrix/pg/schema";
import { dash } from "@better-auth/infra";
import { type BetterAuthPlugin, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const schema = {
  user: userSchema,
  session: sessionSchema,
  account: accountSchema,
  verification: verificationSchema,
};

export interface AuthenticationServerClientOptions {
  appName: string;
  baseUrl: string;
  basePath: string;
  secret?: string;
  socialProviders?: Parameters<typeof betterAuth>[0]["socialProviders"];
  trustedOrigins?: string[];
  plugins?: BetterAuthPlugin[];
}

export const createAuthenticationServerClient = ({
  appName,
  basePath,
  baseUrl,
  plugins = [],
  socialProviders,
  trustedOrigins,
  secret,
}: AuthenticationServerClientOptions) =>
  betterAuth({
    appName,
    basePath,
    database: drizzleAdapter(pg, { provider: "pg", schema }),
    baseURL: baseUrl,
    socialProviders,
    plugins: [...plugins, dash(), tanstackStartCookies()],
    trustedOrigins,
    secret,
    advanced: {
      database: {
        generateId: false,
      },
    },
  });
