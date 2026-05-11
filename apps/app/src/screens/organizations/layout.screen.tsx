import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet } from "@tanstack/react-router";
import { LogoIcon } from "~/assets/icons/logo.svg";
import UserAvatar from "~/components/common/user-avatar.component";
import { getSession } from "~/hooks/authentication/get-session.hook";

export default function OrganizationsLayoutScreen() {
  const {
    data: { session },
  } = useSuspenseQuery({
    queryKey: ["user", "session"],
    queryFn: () => getSession(),
  });

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-30 flex w-full items-center justify-between p-6">
        <Link to="/" aria-label="Go home" className="flex items-center gap-2">
          <LogoIcon size={20} />
          <p className="font-heading text-lg">Agenrix</p>
        </Link>

        {session?.user && <UserAvatar user={session.user} />}
      </header>

      <main className="flex min-h-screen min-w-0 flex-1 items-center justify-center overflow-hidden p-6 md:p-0">
        <Outlet />
      </main>
    </>
  );
}
