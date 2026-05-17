import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { IOrganization } from "~/types/organization.types";
import type { IUser } from "~/types/user.types";
import {
  getHttpHandler,
  getHttpQueryKey,
  getHttpQueryOptions,
  useGetHttp,
} from "../http.hook";

export interface IIntegration {
  id: string;
  appName: "github";
  organizationId: IOrganization;
  connectedBy: IUser;
}

export interface IIntegrationsResponse {
  integrations: IIntegration[];
}

interface IListIntegrationsOptions {
  organizationId: string;
}

const integrationsHttpOptions = ({
  organizationId,
}: IListIntegrationsOptions) => ({
  path: "/integrations/:organizationId",
  pathParams: { organizationId },
});

export const getIntegrations = createServerFn({ method: "GET" })
  .inputValidator((data: IListIntegrationsOptions) => data)
  .handler(async ({ data }) => {
    const requestHeaders = getRequestHeaders();
    const cookie = requestHeaders.get("cookie");

    return getHttpHandler<IIntegrationsResponse>({
      ...integrationsHttpOptions(data),
      headers: cookie ? { cookie } : undefined,
    });
  });

export const getIntegrationsQueryOptions = ({
  organizationId,
}: IListIntegrationsOptions) => {
  return getHttpQueryOptions<IIntegrationsResponse>(
    integrationsHttpOptions({ organizationId }),
  );
};

export const getIntegrationsServerQueryOptions = ({
  organizationId,
}: IListIntegrationsOptions) => {
  const httpOptions = integrationsHttpOptions({ organizationId });

  return queryOptions({
    queryKey: getHttpQueryKey(httpOptions),
    queryFn: () => getIntegrations({ data: { organizationId } }),
  });
};

export const useIntegrations = ({
  organizationId,
}: IListIntegrationsOptions) => {
  return useGetHttp<IIntegrationsResponse>(
    integrationsHttpOptions({ organizationId }),
  );
};
