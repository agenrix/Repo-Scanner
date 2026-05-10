import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { IOrganization } from "~/types/organization.types";
import type { IUser } from "~/types/user.types";
import { getHttpHandler } from "../http/http.hook";

interface IResponse {
  session: {
    user: IUser;
    activeOrganization: IOrganization | null;
    organizations: IOrganization[];
  } | null;
}

export const useAuthentication = createServerFn({ method: "GET" }).handler(
  async () => {
    const requestHeaders = getRequestHeaders();
    const cookie = requestHeaders.get("cookie");

    const { session } = await getHttpHandler<IResponse>({
      path: "/user/session",
      headers: cookie ? { cookie } : undefined,
    });

    return { session };
  },
);
