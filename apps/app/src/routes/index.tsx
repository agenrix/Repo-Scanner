import { GithubLogoIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth/client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data: session, isPending, error } = authClient.useSession();

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <main className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col justify-center gap-6">
        <section className="border border-border bg-card p-6 shadow-[8px_8px_0_var(--border)]">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
            Authentication
          </p>
          <h1 className="mt-3 font-bold text-3xl tracking-tight">
            Sign in with GitHub
          </h1>
          <Button
            className="mt-6 w-full sm:w-auto"
            disabled={isPending}
            onClick={() =>
              authClient.signIn.social({
                provider: "github",
                callbackURL: "http://localhost:3000",
              })
            }
          >
            <GithubLogoIcon weight="fill" />
            {isPending ? "Checking session..." : "Continue with GitHub"}
          </Button>
          {error ? (
            <p className="mt-4 text-destructive text-sm">{error.message}</p>
          ) : null}
        </section>

        <section className="border border-border bg-muted/40 p-4">
          <p className="mb-3 text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Session info
          </p>
          <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed">
            {isPending
              ? "Loading..."
              : JSON.stringify(session ?? null, null, 2)}
          </pre>
        </section>
      </main>
    </div>
  );
}
