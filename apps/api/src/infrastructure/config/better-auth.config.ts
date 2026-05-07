import { createAuthenticationServerClient } from "@agenrix/authentication/server";
import { openAPI } from "@agenrix/authentication/server-plugins";
import { env } from "./env.config";

export const authentication = createAuthenticationServerClient({
  appName: env.name,
  baseUrl: env.http.baseUrl,
  basePath: "/v1/authentication",
  secret: env.authentication.secret,
  plugins: [openAPI()],
});
