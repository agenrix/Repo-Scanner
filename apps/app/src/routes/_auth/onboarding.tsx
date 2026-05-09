import { createFileRoute } from "@tanstack/react-router";
import AuthOnboardingScreen from "~/screens/auth/onboarding.screen";

export const Route = createFileRoute("/_auth/onboarding")({
  component: AuthOnboardingScreen,
});
