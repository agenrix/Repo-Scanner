import z from "zod";
import { zUserResponseMinimal } from "../responses/user.response.validation";

export const zHttpGetUserMinimal = z.object({ user: zUserResponseMinimal });
export const zHttpGetUserNullable = z.object({
  user: zUserResponseMinimal.nullable(),
});
