import { createFileRoute } from "@tanstack/react-router";
import AuthLoginScreen from "~/screens/auth/login.screen";

export const Route = createFileRoute("/auth/login")({
  component: AuthLoginScreen,
});
