import { Link, Outlet } from "@tanstack/react-router";
import { LogoIcon } from "~/assets/icons/logo.svg";
import UserAvatar from "~/components/common/user-avatar.component";
import { Route as ProtectedRoute } from "~/routes/_protected";

export default function OrganizationsLayoutScreen() {
  const { session } = ProtectedRoute.useRouteContext();
  return (
    <>
      <header className="absolute right-0 left-0 flex w-full items-center justify-between">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon size={24} />
            <p className="font-heading text-xl">Agenrix</p>
          </Link>
        </div>

        <div className="pt-4 pr-6">
          <UserAvatar user={session.user} />
        </div>
      </header>

      <main className="flex min-h-screen items-center justify-center overflow-hidden p-6">
        <Outlet />
      </main>
    </>
  );
}
