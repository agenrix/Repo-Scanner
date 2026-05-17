import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Container } from "~/components/common/container.component";
import { AgentsTable } from "~/components/tables/agents/agents-table";
import * as CardComponent from "~/components/ui/card";
import { getSession } from "~/hooks/authentication/get-session.hook";
import { type IAgent, useAgents } from "~/hooks/http/agents/agents.http";
import type { IOrganization } from "~/types/organization.types";
import type { IUser } from "~/types/user.types";

const AGENTS_PAGE_SIZE = 25;

const getScannedInLastDayCount = (items: IAgent[]) => {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  return items.filter((item) => new Date(item.updatedAt).getTime() >= dayAgo)
    .length;
};

function MetricsCards({ agents }: { agents: IAgent[] }) {
  const metrics = [
    {
      label: "Agents scanned (last 24 hrs)",
      value: getScannedInLastDayCount(agents),
    },
    {
      label: "Confirmed agents",
      value: agents.filter((agent) => agent.classification === "AGENT").length,
    },
    {
      label: "Possible agents",
      value: agents.filter((agent) => agent.classification === "POSSIBLE_AGENT")
        .length,
    },
    {
      label: "Repositories scanned",
      value: agents.length,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {metrics.map((metric) => (
        <CardComponent.Card key={metric.label} size="sm" className="border-0">
          <CardComponent.CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">{metric.label}</p>
            <h3 className="font-heading text-2xl">{metric.value}</h3>
          </CardComponent.CardContent>
        </CardComponent.Card>
      ))}
    </div>
  );
}

export default function HomeScreen() {
  const {
    data: { session },
  } = useSuspenseQuery({
    queryKey: ["user", "session"],
    queryFn: () => getSession(),
  });

  if (!session) {
    return <Navigate to={"/login"} replace />;
  }
  if (!session.activeOrganization) {
    return <Navigate to={"/organizations"} replace />;
  }

  return (
    <HomeContent
      user={session.user}
      activeOrganization={session.activeOrganization}
    />
  );
}

function HomeContent({
  activeOrganization,
  user,
}: {
  activeOrganization: IOrganization;
  user: IUser;
}) {
  const [offset, setOffset] = useState(0);
  const queryClient = useQueryClient();

  const firstName = user.name.split(" ").at(0) ?? user.name;
  const organizationId = activeOrganization.id;
  const agentsQuery = useAgents({
    organizationId,
    limit: AGENTS_PAGE_SIZE,
    offset,
  });
  const agents = agentsQuery.data?.agents ?? [];
  const total = agentsQuery.data?.total ?? 0;

  const invalidateAgents = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) =>
        String(query.queryKey[0]).startsWith(
          `repo_scans?organizationId=${encodeURIComponent(organizationId)}`,
        ),
    });
  };

  return (
    <Container>
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl capitalize">
            Hello {firstName},
          </h1>
        </div>

        <MetricsCards agents={agents} />

        <AgentsTable
          organizationId={organizationId}
          agents={agents}
          total={total}
          limit={AGENTS_PAGE_SIZE}
          offset={offset}
          isLoading={agentsQuery.isLoading || agentsQuery.isFetching}
          onPageChange={setOffset}
          onScanStarted={invalidateAgents}
        />
      </div>
    </Container>
  );
}
