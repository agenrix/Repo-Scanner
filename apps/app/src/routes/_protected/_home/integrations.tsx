import { createFileRoute } from "@tanstack/react-router";
import IntegrationsScreen from "~/screens/integrations/integrations.screen";

export const Route = createFileRoute("/_protected/_home/integrations")({
  component: IntegrationsScreen,
});
