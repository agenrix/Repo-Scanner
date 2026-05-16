import {
  GithubLogoIcon,
  type Icon,
  InfoIcon,
  LinkIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { Container } from "~/components/common/container.component";
import { Button } from "~/components/ui/button";
import * as CardComponent from "~/components/ui/card";
import { env } from "~/env";
import { getSession } from "~/hooks/authentication/get-session.hook";
import { useConnectGithubIntegration } from "~/hooks/http/integrations/github/connect.http";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: Icon;
}

function IntegrationCard({
  description,
  name,
  icon: Icon,
}: IntegrationCardProps) {
  const {
    data: { session },
  } = useSuspenseQuery({
    queryKey: ["user", "session"],
    queryFn: () => getSession(),
  });
  const activeOrganizationId = session?.activeOrganization?.id ?? "";

  const { isPending, mutateAsync } = useConnectGithubIntegration({
    organizationId: activeOrganizationId,
  });

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!session.activeOrganization) {
    return <Navigate to="/organizations" replace />;
  }

  const handleConnect = async () => {
    const { url } = await mutateAsync({
      redirectUri: `${env.VITE_BASE_URL}/integrations`,
    });

    window.location.assign(url);
  };

  return (
    <CardComponent.Card className="flex h-58 flex-col justify-between">
      <CardComponent.CardHeader className="space-y-2">
        <CardComponent.CardTitle className="flex items-center gap-2 text-xl">
          <span className="w-fit rounded border bg-muted p-1">
            <Icon weight="duotone" size={20} />
          </span>
          {name}
        </CardComponent.CardTitle>
        <CardComponent.CardDescription className="line-clamp-3 text-foreground/45 text-sm">
          {description}
        </CardComponent.CardDescription>
      </CardComponent.CardHeader>
      <CardComponent.CardFooter className="border-t-none">
        <div className="grid w-full grid-cols-2 gap-2">
          <Button variant={"outline"}>
            <InfoIcon weight="duotone" />
            View details
          </Button>
          <Button
            variant={"outline"}
            disabled={isPending}
            onClick={handleConnect}
          >
            {isPending ? (
              <SpinnerIcon className="animate-spin" />
            ) : (
              <>
                <LinkIcon weight="duotone" />
                <span>Connect</span>
              </>
            )}
          </Button>
        </div>
      </CardComponent.CardFooter>
    </CardComponent.Card>
  );
}

export default function IntegrationsScreen() {
  return (
    <Container>
      <div className="space-y-8">
        <h1 className="font-heading text-3xl">Integrations</h1>

        <div className="grid grid-cols-3 gap-4">
          <IntegrationCard
            name="GitHub"
            description="Install the GitHub integration to scan for agent repositories within your organization"
            icon={GithubLogoIcon}
          />
        </div>
      </div>
    </Container>
  );
}
