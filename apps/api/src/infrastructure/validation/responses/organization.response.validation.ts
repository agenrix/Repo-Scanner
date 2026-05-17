import z from "zod";

export const zOrganizationResponse = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date(),
  logo: z.url().nullable(),
});
