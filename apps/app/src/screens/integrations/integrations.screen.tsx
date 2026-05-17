import {
  GithubLogoIcon,
  type Icon,
  InfoIcon,
  LinkIcon,
  SpinnerIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { Container } from "~/components/common/container.component";
import { Button } from "~/components/ui/button";
import * as CardComponent from "~/components/ui/card";
import { env } from "~/env";
import { getSession } from "~/hooks/authentication/get-session.hook";
import { useConnectGithubIntegration } from "~/hooks/http/integrations/github/connect.http";
import { useDisconnectGithubIntegration } from "~/hooks/http/integrations/github/disconnect.http";
import {
  getIntegrationsQueryOptions,
  useIntegrations,
} from "~/hooks/http/integrations/integrations.http";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: Icon;
  isConnected: boolean;
  organizationId: string;
}

function IntegrationCard({
  description,
  isConnected,
  name,
  icon: Icon,
  organizationId,
}: IntegrationCardProps) {
  const queryClient = useQueryClient();

  const { isPending: isConnecting, mutateAsync: connect } =
    useConnectGithubIntegration({
      organizationId,
    });
  const { isPending: isDisconnecting, mutateAsync: disconnect } =
    useDisconnectGithubIntegration({
      organizationId,
    });

  const integrationsQueryOptions = getIntegrationsQueryOptions({
    organizationId,
  });

  const handleConnect = async () => {
    const { url } = await connect({
      redirectUri: `${env.VITE_BASE_URL}/integrations`,
    });

    window.location.assign(url);
  };

  const handleDisconnect = async () => {
    await disconnect();
    await queryClient.invalidateQueries({
      queryKey: integrationsQueryOptions.queryKey,
    });
  };

  const isPending = isConnecting || isDisconnecting;

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
            variant={isConnected ? "destructive" : "outline"}
            disabled={isPending}
            onClick={isConnected ? handleDisconnect : handleConnect}
          >
            {isPending ? (
              <SpinnerIcon className="animate-spin" />
            ) : isConnected ? (
              <XCircleIcon weight="duotone" />
            ) : (
              <LinkIcon weight="duotone" />
            )}
            <span>{isConnected ? "Disconnect" : "Connect"}</span>
          </Button>
        </div>
      </CardComponent.CardFooter>
    </CardComponent.Card>
  );
}

function IntegrationsList({ organizationId }: { organizationId: string }) {
  const { data } = useIntegrations({ organizationId });
  const githubIntegration = data?.integrations.find(
    (integration) => integration.appName === "github",
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      <IntegrationCard
        name="GitHub"
        description="Install the GitHub integration to scan for agent repositories within your organization"
        icon={GithubLogoIcon}
        isConnected={Boolean(githubIntegration)}
        organizationId={organizationId}
      />
    </div>
  );
}

export default function IntegrationsScreen() {
  const {
    data: { session },
  } = useSuspenseQuery({
    queryKey: ["user", "session"],
    queryFn: () => getSession(),
  });

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!session.activeOrganization) {
    return <Navigate to="/organizations" replace />;
  }

  return (
    <Container>
      <div className="space-y-8">
        <h1 className="font-heading text-3xl">Integrations</h1>

        <IntegrationsList organizationId={session.activeOrganization.id} />
      </div>
    </Container>
  );
}
