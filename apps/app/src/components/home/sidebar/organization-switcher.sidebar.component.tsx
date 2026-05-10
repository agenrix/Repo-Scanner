import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Check, Plus } from "lucide-react";
import React from "react";
import { LogoIcon } from "~/assets/icons/logo.svg";
import * as DropdownMenuComponent from "~/components/ui/dropdown-menu";
import * as SidebarComponent from "~/components/ui/sidebar";

export interface OrganizationSwitcherOrganization {
  id: string;
  name: string;
  createdAt: Date | string;
}

interface OrganizationSwitcherProps {
  organizations?: OrganizationSwitcherOrganization[];
  activeOrganizationId?: string;
  onOrganizationChange?: (
    organization: OrganizationSwitcherOrganization,
  ) => void;
  onCreateOrganization?: () => void;
}

export default function SidebarOrganizationSwitcher({
  organizations = [],
  activeOrganizationId,
  onOrganizationChange,
  onCreateOrganization,
}: OrganizationSwitcherProps) {
  const shouldPreventTriggerFocusRef = React.useRef(false);

  const [activeOrganization, setActiveOrganization] = React.useState<
    OrganizationSwitcherOrganization | undefined
  >(
    () =>
      organizations.find(
        (organization) => organization.id === activeOrganizationId,
      ) ?? organizations.at(0),
  );

  React.useEffect(() => {
    const nextActiveOrganization =
      organizations.find(
        (organization) => organization.id === activeOrganizationId,
      ) ?? organizations.at(0);

    setActiveOrganization(nextActiveOrganization);
  }, [activeOrganizationId, organizations]);

  if (!activeOrganization) {
    return (
      <SidebarComponent.SidebarMenu>
        <SidebarComponent.SidebarMenuItem>
          <SidebarComponent.SidebarMenuButton disabled>
            Organization unavailable
          </SidebarComponent.SidebarMenuButton>
        </SidebarComponent.SidebarMenuItem>
      </SidebarComponent.SidebarMenu>
    );
  }

  return (
    <SidebarComponent.SidebarMenu>
      <SidebarComponent.SidebarMenuItem>
        <DropdownMenuComponent.DropdownMenu>
          <DropdownMenuComponent.DropdownMenuTrigger asChild>
            <SidebarComponent.SidebarMenuButton className="w-fit max-w-44 gap-1.5 rounded-md px-2">
              <LogoIcon size={16} />
              <span className="mr-1.5 max-w-40 truncate font-medium">
                {activeOrganization.name}
              </span>
              <HugeiconsIcon icon={ArrowDown01Icon} />
            </SidebarComponent.SidebarMenuButton>
          </DropdownMenuComponent.DropdownMenuTrigger>
          <DropdownMenuComponent.DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
            onPointerDownCapture={() => {
              shouldPreventTriggerFocusRef.current = true;
            }}
            onKeyDownCapture={() => {
              shouldPreventTriggerFocusRef.current = false;
            }}
            onCloseAutoFocus={(event) => {
              if (shouldPreventTriggerFocusRef.current) {
                event.preventDefault();
              }
              shouldPreventTriggerFocusRef.current = false;
            }}
          >
            <DropdownMenuComponent.DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuComponent.DropdownMenuLabel>
            {[...organizations]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((organization) => (
                <DropdownMenuComponent.DropdownMenuItem
                  key={organization.id}
                  onClick={() => {
                    setActiveOrganization(organization);
                    onOrganizationChange?.(organization);
                  }}
                  className="p-2 font-medium"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-xs border">
                        {organization.name.at(0)?.toUpperCase()}
                      </div>
                      <span className="truncate">{organization.name}</span>
                    </div>
                    {organization.id === activeOrganization.id && (
                      <Check className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </DropdownMenuComponent.DropdownMenuItem>
              ))}
            <DropdownMenuComponent.DropdownMenuSeparator />
            <DropdownMenuComponent.DropdownMenuItem
              onClick={onCreateOrganization}
              className="group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-6 items-center justify-center rounded-md border bg-muted group-hover:bg-muted-foreground/25">
                  <Plus className="size-4" />
                </div>
                <div>Create organization</div>
              </div>
            </DropdownMenuComponent.DropdownMenuItem>
          </DropdownMenuComponent.DropdownMenuContent>
        </DropdownMenuComponent.DropdownMenu>
      </SidebarComponent.SidebarMenuItem>
    </SidebarComponent.SidebarMenu>
  );
}
