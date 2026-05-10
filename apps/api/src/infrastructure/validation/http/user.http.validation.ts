import z from "zod";
import {
  zUserResponseMinimal,
  zUserSesssionResponseMinimal as zUserSessionResponseMinimal,
} from "../responses/user.response.validation";

export const zHttpGetUserMinimal = z.object({ user: zUserResponseMinimal });
export const zHttpGetUserNullable = z.object({
  user: zUserResponseMinimal.nullable(),
});

export const zHttpGetUserSessionMinimal = z.object({
  session: zUserSessionResponseMinimal,
});
export const zHttpGetUserSessionNullable = z.object({
  session: zUserSessionResponseMinimal.nullable(),
});
