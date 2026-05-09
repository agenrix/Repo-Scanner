import { createFileRoute } from "@tanstack/react-router";
import AuthOnboardingScreen from "~/screens/auth/onboarding.screen";

export const Route = createFileRoute("/auth/onboarding")({
  loader: ({ context: { queryClient } }) => {
    // const {} = queryClient.ensureQueryData();
  },
  component: AuthOnboardingScreen,
});
