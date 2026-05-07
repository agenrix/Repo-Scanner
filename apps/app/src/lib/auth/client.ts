import { createAuthReactClient } from "@agenrix/authentication/react";
import { env } from "~/env";

export const authClient = createAuthReactClient({
  baseUrl: env.VITE_API_URL,
  basePath: "/v1/authentication",
});
