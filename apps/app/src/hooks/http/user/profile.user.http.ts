import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { IUser } from "~/types/user.types";
import { getHttpHandler, useGetHttp } from "../http.hook";

interface IResponse {
  user: IUser | null;
}

export const useUserProfile = () => {
  return useGetHttp<IResponse>({ path: "/user/profile" });
};

export const getUserProfileServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const requestHeaders = getRequestHeaders();
    const cookie = requestHeaders.get("cookie");

    return await getHttpHandler<IResponse>({
      path: "user/profile",
      headers: cookie ? { cookie } : undefined,
    });
  },
);
