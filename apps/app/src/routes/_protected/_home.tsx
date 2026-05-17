import { createFileRoute } from "@tanstack/react-router";
import HomeLayoutScreen from "~/screens/home/layout.screen";

export const Route = createFileRoute("/_protected/_home")({
  component: HomeLayoutScreen,
});
