import { createAuthenticationServerClient } from "@agenrix/authentication/server";
import { openAPI } from "@agenrix/authentication/server-plugins";
import { env } from "./env.config";
import { postgres } from "./postgres.config";

export const authentication = createAuthenticationServerClient({
  appName: env.name,
  baseUrl: env.http.baseUrl,
  basePath: "/v1/authentication",
  database: postgres,
  secret: env.authentication.secret,
  socialProviders: {
    github: {
      clientId: env.oauth.github.clientId,
      clientSecret: env.oauth.github.clientSecret,
    },
  },
  plugins: [openAPI()],
  trustedOrigins: env.http.corsOrigins,
});

export type IAuthentication = typeof authentication.$Infer;
