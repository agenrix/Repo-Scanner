import { Outlet } from "@tanstack/react-router";
import HomeSidebar from "~/components/home/sidebar/index.sidebar.component";
import { SidebarProvider } from "~/components/ui/sidebar";
import { Route as ProtectedRoute } from "~/routes/_protected";

export default function HomeLayoutScreen() {
  const { session } = ProtectedRoute.useRouteContext();

  return (
    <SidebarProvider>
      <HomeSidebar
        user={session.user}
        organizations={session.organizations}
        activeOrganization={session.activeOrganization}
      />
      <main className="min-h-0 min-w-0 flex-1">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
