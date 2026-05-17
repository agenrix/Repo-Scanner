import type { BetterAuthClientPlugin } from "better-auth";
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "./client-plugins";

export interface AuthenticationReactClientOptions {
  baseUrl: string;
  basePath: string;
  plugins?: BetterAuthClientPlugin[];
}

export const createAuthReactClient = ({
  basePath,
  baseUrl,
  plugins = [],
}: AuthenticationReactClientOptions) =>
  createAuthClient({
    baseURL: baseUrl,
    basePath,
    plugins: [...plugins, organizationClient({})],
    fetchOptions: { credentials: "include" },
  });
