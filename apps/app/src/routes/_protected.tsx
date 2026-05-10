import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthentication } from "~/hooks/authentication/use-authentication";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location, context: { queryClient } }) => {
    const { session } = await queryClient.ensureQueryData({
      queryKey: ["user", "session"],
      queryFn: () => useAuthentication(),
    });

    if (!session) {
      throw redirect({ to: "/login" });
    }

    if (location.pathname === "/" && !session.activeOrganization) {
      if (session.organizations.length === 0) {
        throw redirect({ to: "/organizations/new" });
      }

      throw redirect({ to: "/organizations" });
    }

    return { session };
  },
});
