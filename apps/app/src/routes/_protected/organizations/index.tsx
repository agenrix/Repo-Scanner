import { createFileRoute } from "@tanstack/react-router";
import OrganizationsScreen from "~/screens/organizations/organizations.screen";

export const Route = createFileRoute("/_protected/organizations/")({
  component: OrganizationsScreen,
});
