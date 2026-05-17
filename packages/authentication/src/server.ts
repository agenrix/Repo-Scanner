import type { Postgres } from "@agenrix/pg";
import {
  accountSchema,
  invitationSchema,
  memberSchema,
  organizationSchema,
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
  organization: organizationSchema,
  member: memberSchema,
  invitation: invitationSchema,
};

export interface AuthenticationServerClientOptions<
  TPlugins extends BetterAuthPlugin[] = [],
> {
  appName: string;
  baseUrl: string;
  basePath: string;
  database: Postgres;
  secret: string;
  socialProviders?: Parameters<typeof betterAuth>[0]["socialProviders"];
  trustedOrigins?: string[];
  plugins?: TPlugins;
}

export const createAuthenticationServerClient = <
  const TPlugins extends BetterAuthPlugin[] = [],
>({
  appName,
  basePath,
  baseUrl,
  database,
  plugins,
  socialProviders,
  trustedOrigins,
  secret,
}: AuthenticationServerClientOptions<TPlugins>) => {
  const authPlugins = [...(plugins ?? []), organization()] as unknown as [
    ...TPlugins,
    ReturnType<typeof organization>,
  ];

  return betterAuth({
    appName,
    basePath,
    database: drizzleAdapter(database, {
      provider: "pg",
      schema,
    }),
    baseURL: baseUrl,
    socialProviders,
    plugins: authPlugins,
    trustedOrigins,
    secret,
    experimental: {
      joins: true,
    },
    advanced: {
      database: {
        generateId: false,
      },
    },
  });
};

// export const auth = createAuthenticationServerClient({
//   appName: "@agenrix/authentication",
//   basePath: "/v1/authentication",
//   baseUrl: "http://localhost:3001",
// });
