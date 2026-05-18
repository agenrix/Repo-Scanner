import { api } from "./api.http";

export const organizationHttp = {
  createOrganization: async (data: { name: string; slug: string }) => {
    return api
      .post("organizations", { json: data })
      .json<{ data: { id: string; name: string; slug: string } }>();
  },
  inviteTeammate: async (
    organizationId: string,
    data: { email: string; role?: string },
  ) => {
    return api
      .post(`organizations/${organizationId}/invitation`, { json: data })
      .json<{ data: { id: string; email: string; status: string } }>();
  },
};
