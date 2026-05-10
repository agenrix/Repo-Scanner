import { createFileRoute } from "@tanstack/react-router";
import OrganizationsLayoutScreen from "~/screens/organizations/layout.screen";

export const Route = createFileRoute("/_protected/organizations")({
  component: OrganizationsLayoutScreen,
});
