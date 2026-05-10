import { useSuspenseQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { getSession } from "~/hooks/authentication/get-session.hook";

export default function HomeScreen() {
  const {
    data: { session },
  } = useSuspenseQuery({
    queryKey: ["user", "session"],
    queryFn: () => getSession(),
  });

  if (!session) {
    return <Navigate to={"/login"} replace />;
  }
  if (!session.activeOrganization) {
    return <Navigate to={"/organizations"} replace />;
  }

  const firstName = session.user.name.split(" ").at(0) ?? session.user.name;

  return (
    <div className="max-w-7xl px-6 py-10">
      <h1 className="font-heading text-3xl capitalize">Hello {firstName},</h1>
    </div>
  );
}
