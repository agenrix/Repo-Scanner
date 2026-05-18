import { GithubLogoIcon, SpinnerIcon } from "@phosphor-icons/react";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { env } from "~/env";

export default function AuthLoginScreen() {
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  async function handleGithubLogin() {
    setIsSigningIn(true);

    try {
      window.location.href = `${env.VITE_API_URL}/v1/authentication/sign-in/github`;
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
        <p className="text-center font-medium text-muted-foreground text-sm">
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
        {isSigningIn ? (
          <SpinnerIcon className="animate-spin" />
        ) : (
          <span className="flex items-center gap-1.5">
            <GithubLogoIcon weight="duotone" />
            <p>Continue with GitHub</p>
          </span>
        )}
      </Button>
    </div>
  );
}
