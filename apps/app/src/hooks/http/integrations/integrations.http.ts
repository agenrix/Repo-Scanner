import type { IOrganization } from "~/types/organization.types";
import type { IUser } from "~/types/user.types";
import { getHttpQueryOptions, useGetHttp } from "../http.hook";

export interface IIntegration {
  id: string;
  appName: "github";
  organizationId: IOrganization;
  connectedBy: IUser;
}

interface IIntegrationsResponse {
  integrations: IIntegration[];
}

interface IListIntegrationsOptions {
  organizationId: string;
}

export const getIntegrationsQueryOptions = ({
  organizationId,
}: IListIntegrationsOptions) => {
  return getHttpQueryOptions<IIntegrationsResponse>({
    path: "/integrations/:organizationId",
    pathParams: { organizationId },
  });
};

export const useIntegrations = ({
  organizationId,
}: IListIntegrationsOptions) => {
  return useGetHttp<IIntegrationsResponse>({
    path: "/integrations/:organizationId",
    pathParams: { organizationId },
  });
};
