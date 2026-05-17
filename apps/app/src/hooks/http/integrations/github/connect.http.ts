import { usePostHttp } from "../../http.hook";

interface IConnectGithubIntegrationOptions {
  organizationId: string;
}

interface IConnectGithubIntegrationResponse {
  url: string;
}

interface IConnectGithubIntegrationRequest {
  redirectUri: string;
}

export const useConnectGithubIntegration = ({
  organizationId,
}: IConnectGithubIntegrationOptions) => {
  return usePostHttp<
    IConnectGithubIntegrationResponse,
    IConnectGithubIntegrationRequest
  >({
    path: "/integrations/github/:organizationId",
    pathParams: { organizationId },
  });
};
