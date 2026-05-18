import { patchHttpHandler, postHttpHandler } from "~/hooks/http/http.hook";

export const userHttp = {
  setActiveOrganization: async (organizationId: string) => {
    return patchHttpHandler<{ success: true }, { organizationId: string }>(
      { path: "/user/session" },
      { organizationId },
    );
  },
  signOut: async () => {
    return postHttpHandler<null, undefined>(
      { path: "/authentication/sign-out" },
      undefined,
    );
  },
};
