import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "~/hooks/authentication/get-session.hook";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location, context: { queryClient } }) => {
    const { session } = await queryClient.ensureQueryData({
      queryKey: ["user", "session"],
      queryFn: () => getSession(),
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
