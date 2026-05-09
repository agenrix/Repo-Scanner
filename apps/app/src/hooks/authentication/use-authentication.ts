import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { IUser } from "~/types/user.types";
import { getHttpHandler } from "../http/http.hook";

interface IResponse {
  user: IUser | null;
}

export const useAuthentication = createServerFn({ method: "GET" })
  .inputValidator((data: { pathname: string }) => data)
  .handler(async ({ data }) => {
    const requestHeaders = getRequestHeaders();
    const cookie = requestHeaders.get("cookie");

    const { user } = await getHttpHandler<IResponse>({
      path: "user/profile",
      headers: cookie ? { cookie } : undefined,
    });

    if (user === null && data.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }

    if (user !== null && data.pathname === "/login") {
      throw redirect({ to: "/organizations" });
    }

    return { user };
  });
