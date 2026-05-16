import z from "zod";
import { zOrganizationResponse } from "./organization.response.validation";
import { zUserResponse } from "./user.response.validation";

export const zIntegrationResponse = z.object({
  id: z.string(),
  appName: z.enum(["github"]),
  organizationId: zOrganizationResponse,
  connectedBy: zUserResponse,
});
export type IzIntegrationResponse = z.infer<typeof zIntegrationResponse>;
