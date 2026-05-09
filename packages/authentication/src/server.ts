import { pg } from "@agenrix/pg";
import {
  accountSchema,
  sessionSchema,
  userSchema,
  verificationSchema,
} from "@agenrix/pg/schema";
import { type BetterAuthPlugin, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

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
    plugins: [...plugins, organization()],
    trustedOrigins,
    secret,
    advanced: {
      database: {
        generateId: false,
      },
    },
  });

// export const auth = createAuthenticationServerClient({
//   appName: "@agenrix/authentication",
//   basePath: "/v1/authentication",
//   baseUrl: "http://localhost:3001",
// });
