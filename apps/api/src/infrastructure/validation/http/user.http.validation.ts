import z from "zod";
import {
  zUserResponse,
  zUserSesssionResponse as zUserSessionResponseMinimal,
} from "../responses/user.response.validation";

export const zHttpGetUserMinimal = z.object({ user: zUserResponse });
export const zHttpGetUserNullable = z.object({
  user: zUserResponse.nullable(),
});

export const zHttpGetUserSessionMinimal = z.object({
  session: zUserSessionResponseMinimal,
});
export const zHttpGetUserSessionNullable = z.object({
  session: zUserSessionResponseMinimal.nullable(),
});
