import { useDeleteHttp } from "../../http.hook";

interface IDisconnectGithubIntegrationOptions {
  organizationId: string;
}

export const useDisconnectGithubIntegration = ({
  organizationId,
}: IDisconnectGithubIntegrationOptions) => {
  return useDeleteHttp<null>({
    path: "/integrations/github/:organizationId",
    pathParams: { organizationId },
  });
};
