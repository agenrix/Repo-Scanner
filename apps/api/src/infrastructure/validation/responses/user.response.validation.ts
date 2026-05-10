import z from "zod";

export const zUserResponseMinimal = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.url().nullable(),
});

export type IzUserResponseMinimal = z.infer<typeof zUserResponseMinimal>;

export const zUserSesssionResponseMinimal = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    image: z.url().nullable(),
  }),
  activeOrganization: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      createdAt: z.date(),
      logo: z.url().nullable(),
      metadata: z.record(z.string(), z.string()),
    })
    .nullable(),
  organizations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      createdAt: z.date(),
      logo: z.url().nullable(),
      metadata: z.record(z.string(), z.string()),
    }),
  ),
});

export type IzUserSesssionResponseMinimal = z.infer<
  typeof zUserSesssionResponseMinimal
>;
