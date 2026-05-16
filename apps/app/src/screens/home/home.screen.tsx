import { useSuspenseQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { Container } from "~/components/common/container.component";
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
    <Container>
      <h1 className="font-heading text-3xl capitalize">Hello {firstName},</h1>
    </Container>
  );
}
