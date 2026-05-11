import {
  Blockchain01Icon,
  Home03Icon,
  LifebuoyIcon,
  Robot01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { LogoIcon } from "~/assets/icons/logo.svg";
import * as SidebarComponent from "~/components/ui/sidebar";
import { useSidebar } from "~/components/ui/sidebar";
import type { IOrganization } from "~/types/organization.types";
import type { IUser } from "~/types/user.types";
import SidebarNavUser from "./nav-user.sidebar.component";
import SidebarOrganizationSwitcher from "./organization-switcher.sidebar.component";

interface HomeSidebarProps {
  user?: IUser;
  organizations?: IOrganization[];
  activeOrganization?: IOrganization | null;
}

const platformLinks = [
  {
    label: "Home",
    to: "/",
    icon: Home03Icon,
  },
  {
    label: "Agents",
    to: "/",
    icon: Robot01Icon,
  },
  {
    label: "Integrations",
    to: "/",
    icon: Blockchain01Icon,
  },
] as const;

const footerLinks = [
  {
    label: "Settings",
    to: "/",
    icon: Settings02Icon,
  },
  {
    label: "Feedback",
    to: "/",
    icon: LifebuoyIcon,
  },
] as const;

export default function HomeSidebar({
  user,
  organizations,
  activeOrganization,
}: HomeSidebarProps) {
  const { toggleSidebar, state } = useSidebar();
  return (
    <SidebarComponent.Sidebar collapsible="icon">
      <SidebarComponent.SidebarHeader className="flex flex-row items-center justify-between">
        {state === "collapsed" ? (
          <SidebarComponent.SidebarMenu>
            <SidebarComponent.SidebarMenuItem>
              <SidebarComponent.SidebarMenuButton
                className="cursor-pointer rounded"
                onClick={toggleSidebar}
              >
                <LogoIcon size={12} />
              </SidebarComponent.SidebarMenuButton>
            </SidebarComponent.SidebarMenuItem>
          </SidebarComponent.SidebarMenu>
        ) : (
          <SidebarOrganizationSwitcher
            organizations={organizations}
            activeOrganizationId={activeOrganization?.id}
          />
        )}

        {state !== "collapsed" && (
          <SidebarComponent.SidebarTrigger className="rounded" />
        )}
      </SidebarComponent.SidebarHeader>

      <div className="w-full border-b" />

      <SidebarComponent.SidebarContent>
        <SidebarComponent.SidebarGroup>
          <SidebarComponent.SidebarGroupLabel>
            Platform
          </SidebarComponent.SidebarGroupLabel>

          <SidebarComponent.SidebarMenu className="space-y-1">
            {platformLinks.map((item) => (
              <SidebarComponent.SidebarMenuItem key={item.label}>
                <SidebarComponent.SidebarMenuButton
                  className="rounded font-medium"
                  asChild
                >
                  <Link to={item.to}>
                    <HugeiconsIcon
                      icon={item.icon}
                      color="var(--color-muted-foreground)"
                      strokeWidth={2}
                    />
                    {item.label}
                  </Link>
                </SidebarComponent.SidebarMenuButton>
              </SidebarComponent.SidebarMenuItem>
            ))}
          </SidebarComponent.SidebarMenu>
        </SidebarComponent.SidebarGroup>
      </SidebarComponent.SidebarContent>

      <SidebarComponent.SidebarFooter>
        <SidebarComponent.SidebarGroup className="p-0">
          <SidebarComponent.SidebarGroupContent>
            <SidebarComponent.SidebarMenu className="space-y-1">
              {footerLinks.map((item) => (
                <SidebarComponent.SidebarMenuButton
                  key={item.label}
                  className="rounded font-medium"
                  size="sm"
                  asChild
                >
                  <Link to={item.to}>
                    <HugeiconsIcon
                      icon={item.icon}
                      color="var(--color-muted-foreground)"
                      strokeWidth={2}
                    />
                    {item.label}
                  </Link>
                </SidebarComponent.SidebarMenuButton>
              ))}
            </SidebarComponent.SidebarMenu>
          </SidebarComponent.SidebarGroupContent>
        </SidebarComponent.SidebarGroup>

        <div className="w-full border-b"></div>
        <SidebarNavUser
          user={
            user
              ? {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  avatar: user.image,
                }
              : undefined
          }
        />
      </SidebarComponent.SidebarFooter>
    </SidebarComponent.Sidebar>
  );
}
