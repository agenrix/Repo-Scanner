import z from "zod";
import { zOrganizationResponse } from "./organization.response.validation";

export const zUserResponse = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.url().nullable(),
});

export type IzUserResponseMinimal = z.infer<typeof zUserResponse>;

export const zUserSesssionResponse = z.object({
  user: zUserResponse,
  activeOrganization: zOrganizationResponse.nullable(),
  organizations: z.array(zOrganizationResponse),
});

export type IzUserSesssionResponseMinimal = z.infer<
  typeof zUserSesssionResponse
>;
