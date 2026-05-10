import {
  CheckmarkBadge02Icon,
  LoginSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";

interface SidebarNavUserData {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface SidebarNavUserProps {
  user?: SidebarNavUserData | null;
  onLogOut?: () => void | Promise<void>;
}

export default function SidebarNavUser({
  user,
  onLogOut,
}: SidebarNavUserProps) {
  const { state } = useSidebar();

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "rounded data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                { "rounded-full": state === "collapsed" },
              )}
            >
              <Avatar className="size-8">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.id} />}
                <AvatarFallback className="">
                  {user.name?.at(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-muted-foreground text-xs">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={state === "collapsed" ? "right" : "top"}
            align="end"
            sideOffset={state === "collapsed" ? 10 : 4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2.5 text-left text-sm">
                <Avatar className="size-8">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} alt={user.id} />
                  )}
                  <AvatarFallback className="">
                    {user.name?.at(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-foreground">
                    {user.name}
                  </span>
                  <span className="truncate text-muted-foreground text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="px-2 py-2.5">
                <HugeiconsIcon icon={CheckmarkBadge02Icon} />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogOut} variant="destructive">
              <HugeiconsIcon icon={LoginSquare01Icon} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
