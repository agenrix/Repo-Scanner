import ky from "ky";
import { env } from "~/env";

export const api = ky.create({
  baseUrl: `${env.VITE_API_URL}/v1`,
  credentials: "include",
  timeout: 30_000,
});
