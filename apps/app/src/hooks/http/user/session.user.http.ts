import type { IOrganization } from "~/types/organization.types";
import type { IUser } from "~/types/user.types";
import { useGetHttp } from "../http.hook";

interface IResponse {
  session: {
    user: IUser;
    activeOrganization: IOrganization | null;
    organizations: IOrganization[];
  } | null;
}

export const useUserSession = () => {
  return useGetHttp<IResponse>({ path: "/user/session" });
};
