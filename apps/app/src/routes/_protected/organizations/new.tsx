import { createFileRoute } from "@tanstack/react-router";
import CreateOrganizationScreen from "~/screens/organizations/create-organization.screen";

export const Route = createFileRoute("/_protected/organizations/new")({
  component: CreateOrganizationScreen,
});
