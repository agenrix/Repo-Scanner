import { createFileRoute, redirect } from "@tanstack/react-router";
import { getIntegrationsServerQueryOptions } from "~/hooks/http/integrations/integrations.http";
import IntegrationsScreen from "~/screens/integrations/integrations.screen";

export const Route = createFileRoute("/_protected/_home/integrations")({
  loader: async ({ context: { queryClient, session } }) => {
    if (!session.activeOrganization?.id) {
      throw redirect({ to: "/organizations", replace: true });
    }

    await queryClient.ensureQueryData(
      getIntegrationsServerQueryOptions({
        organizationId: session.activeOrganization.id,
      }),
    );
  },
  component: IntegrationsScreen,
});
