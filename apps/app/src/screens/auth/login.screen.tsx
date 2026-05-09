import { GithubLogoIcon } from "@phosphor-icons/react";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { env } from "~/env";
import { authClient } from "~/lib/auth/client";

export default function AuthLoginScreen() {
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  async function handleGithubLogin() {
    setIsSigningIn(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "github",
        callbackURL: `${env.VITE_BASE_URL}/onboarding`,
      });

      if (error) {
        throw new Error(error.message ?? "Something went wrong");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
        { richColors: true },
      );
      setIsSigningIn(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="space-y-2">
        <h1 className="text-center font-heading font-medium text-2xl">
          Welcome to Agenrix
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          Sign in or create an account
        </p>
      </div>

      <Button
        disabled={isSigningIn}
        onClick={handleGithubLogin}
        type="button"
        className="w-full"
        size={"lg"}
      >
        <GithubLogoIcon weight="duotone" />
        Continue with GitHub
      </Button>
    </div>
  );
}
