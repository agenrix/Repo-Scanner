import z from "zod";

export const zOrganizationFormCreate = z.object({
  name: z
    .string()
    .min(1, "Please enter an organization name")
    .max(32, "Organization name cannot exceed 32 characters"),
});
export type IzOrganizationFormCreate = z.infer<typeof zOrganizationFormCreate>;
