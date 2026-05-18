import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import HomeSidebar from "~/components/home/sidebar/index.sidebar.component";
import { SidebarProvider } from "~/components/ui/sidebar";
import { userHttp } from "~/lib/http/user.http";
import { Route as ProtectedRoute } from "~/routes/_protected";

export default function HomeLayoutScreen() {
  const { session } = ProtectedRoute.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogOut = async () => {
    try {
      await userHttp.signOut();

      // Immediately clear the session cache to avoid stale reads
      queryClient.setQueryData(["user", "session"], { session: null });
      await queryClient.invalidateQueries({ queryKey: ["user", "session"] });

      // Navigate back to login
      await navigate({ to: "/login" });
      toast.success("Logged out successfully", { richColors: true });
    } catch (error) {
      toast.error("Failed to log out", {
        richColors: true,
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <SidebarProvider>
      <HomeSidebar
        user={session.user}
        organizations={session.organizations}
        activeOrganization={session.activeOrganization}
        onLogOut={handleLogOut}
      />
      <main className="min-h-0 min-w-0 flex-1">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
