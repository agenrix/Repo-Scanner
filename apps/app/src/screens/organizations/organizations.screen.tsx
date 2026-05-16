import { PlusIcon } from "@phosphor-icons/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { SubmitButton } from "~/components/common/submit-button.component";
import * as AvatarComponent from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { getSession } from "~/hooks/authentication/get-session.hook";

export default function OrganizationsScreen() {
  const [launchingOrganizationId, setLaunchingOrganizationId] = React.useState<
    string | null
  >(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: { session },
  } = useSuspenseQuery({
    queryKey: ["user", "session"],
    queryFn: () => getSession(),
  });

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const firstName = session.user.name.split(" ").at(0) ?? session.user.name;

  async function handleOrganizationLaunch(organizationId: string) {
    // TODO: REMOVE LATER - Replaced by custom Drizzle Auth
    // The endpoint /v1/user/session handles the active organization logic.
    // For now, we will just simulate a success response since setting active org
    // requires a new custom DB endpoint.
    setLaunchingOrganizationId(organizationId);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      await queryClient.invalidateQueries({
        queryKey: ["user", "session"],
      });

      await navigate({ to: "/" });
    } catch (error) {
      toast.error("Failed to launch organization", {
        richColors: true,
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLaunchingOrganizationId(null);
    }
  }

  return (
    <div className="relative z-20 m-auto flex w-full max-w-120 flex-col">
      <div className="text-center">
        <h1 className="mb-2 font-heading text-lg lg:text-xl">
          Welcome, {firstName}
        </h1>
        <p className="mb-8 text-muted-foreground text-sm">
          Select an organization or create a new one.
        </p>
      </div>

      {session.organizations.length ? (
        <>
          <span className="mb-4 text-muted-foreground text-sm">
            Organizations
          </span>
          <div className="max-h-65 overflow-y-auto">
            <div className="divide-y divide-border">
              {session.organizations.map((organization) => {
                const isLaunching = launchingOrganizationId === organization.id;

                return (
                  <div
                    key={organization.id}
                    className="flex min-h-14 w-full items-center justify-between gap-4 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <AvatarComponent.Avatar className="rounded-none">
                        {organization.logo && (
                          <AvatarComponent.AvatarImage
                            alt={organization.name}
                            className="rounded-none"
                            src={organization.logo}
                          />
                        )}
                        <AvatarComponent.AvatarFallback className="rounded-none font-medium uppercase">
                          {organization.name.slice(0, 2)}
                        </AvatarComponent.AvatarFallback>
                      </AvatarComponent.Avatar>
                      <p className="truncate font-medium text-sm">
                        {organization.name}
                      </p>
                    </div>

                    <SubmitButton
                      isSubmitting={isLaunching}
                      variant={"outline"}
                      className="px-4"
                      onClick={() => handleOrganizationLaunch(organization.id)}
                    >
                      Launch
                    </SubmitButton>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded border border-dashed p-4 text-center text-muted-foreground text-sm">
          Create an organization to get started.
        </div>
      )}

      <div className="relative mt-12 w-full border-border border-t border-dashed pt-6 text-center">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-4 text-muted-foreground text-sm">
          Or
        </span>
        <Button asChild className="mt-2 w-full" variant="outline">
          <Link to="/organizations/new" className="text-xs">
            <PlusIcon />
            Create organization
          </Link>
        </Button>
      </div>
    </div>
  );
}
