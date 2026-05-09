import z from "zod";

export const zUserResponseMinimal = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.url().nullable(),
});

export type IzUserResponseMinimal = z.infer<typeof zUserResponseMinimal>;
