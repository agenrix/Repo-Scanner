import { useGetHttp, usePostHttp } from "../http.hook";

export type AgentClassification = "AGENT" | "POSSIBLE_AGENT" | "NOT_AGENT";
export type AgentConfidence = "high" | "medium" | "low";
export type AgentStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface IAgentAccessRights {
  files: string[];
  tools: string[];
  data_nodes: string[];
  apis: string[];
  servers: string[];
}

export interface IAgentIntegrationDetails {
  apis: string[];
  tools: string[];
  frameworks: string[];
}

export interface IAgent {
  id: string;
  organizationId: string;
  repoId: string;
  repoName: string;
  repoLink: string;
  classification: AgentClassification | null;
  confidence: AgentConfidence | null;
  status: AgentStatus;
  agentSignals: string[];
  evidenceFiles: string[];
  frameworksDetected: string[];
  reasoning: string | null;
  agentId: string | null;
  agentName: string | null;
  agentDescription: string | null;
  agentOwner: string | null;
  agentContributors: string[];
  agentAccessRights: IAgentAccessRights | null;
  agentIntegrationDetails: IAgentIntegrationDetails | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAgentsResponse {
  agents: IAgent[];
  total: number;
  limit: number;
  offset: number;
}

export interface ITriggerAgentScanBody {
  organizationId: string;
  repository: string;
}

export interface ITriggerAgentScanResponse {
  eventId: string[];
}

export const agentsQueryKey = ({
  organizationId,
  limit,
  offset,
}: {
  organizationId: string;
  limit: number;
  offset: number;
}) => ["repo_scans", organizationId, `limit:${limit}`, `offset:${offset}`];

export const useAgents = ({
  organizationId,
  limit,
  offset,
}: {
  organizationId: string;
  limit: number;
  offset: number;
}) => {
  return useGetHttp<IAgentsResponse>({
    path: `/repo_scans?organizationId=${encodeURIComponent(organizationId)}&limit=${limit}&offset=${offset}`,
  });
};

export const useTriggerAgentScan = () => {
  return usePostHttp<ITriggerAgentScanResponse, ITriggerAgentScanBody>({
    path: "/repo_scans/scan",
  });
};
