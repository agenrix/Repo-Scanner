import z from "zod";
import { zIntegrationResponse } from "../responses/integrations.response.validation";

export const zHttpGetIntegration = z.object({
  integration: zIntegrationResponse,
});
export const zHttpGetIntegrations = z.object({
  integrations: z.array(zIntegrationResponse),
});
