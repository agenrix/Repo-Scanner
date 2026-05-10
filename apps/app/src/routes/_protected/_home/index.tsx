import { createFileRoute } from "@tanstack/react-router";
import HomeScreen from "~/screens/home/home.screen";

export const Route = createFileRoute("/_protected/_home/")({
  component: HomeScreen,
});
