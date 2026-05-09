import { createFileRoute } from "@tanstack/react-router";
import { useAuthentication } from "~/hooks/authentication/use-authentication";

export const Route = createFileRoute("/_protected")({
  beforeLoad: ({ location: { pathname } }) =>
    useAuthentication({ data: { pathname } }),
});
