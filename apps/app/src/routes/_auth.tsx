import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "~/hooks/authentication/get-session.hook";
import AuthLayoutScren from "~/screens/auth/layout.screen";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context: { queryClient } }) => {
    const { session } = await queryClient.ensureQueryData({
      queryKey: ["user", "session"],
      queryFn: () => getSession(),
    });

    if (session) {
      if (session.organizations.length === 0) {
        throw redirect({ to: "/organizations/new" });
      }

      if (session.activeOrganization) {
        throw redirect({ to: "/" });
      }

      throw redirect({ to: "/organizations" });
    }

    return { session };
  },
  component: AuthLayoutScren,
});
