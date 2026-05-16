import { SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";

import type { IUser } from "~/types/user.types";
import * as AvatarComponent from "../ui/avatar";
import * as DropdownMenuComponent from "../ui/dropdown-menu";

interface UserAvatarProps {
  user: IUser;
}

export default function UserAvatar({ user }: UserAvatarProps) {
  const queryClient = useQueryClient();
  const toastId = React.useRef<string | number>(undefined);

  async function handleSignOut() {
    toastId.current = toast.loading("Signing out...");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/authentication/sign-out`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error("Failed to sign out");

      toast.success("Signed out successfully", { id: toastId.current });
      queryClient.clear();
      window.location.href = "/login";
    } catch (error) {
      toast.error("Failed to sign out", {
        richColors: true,
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        id: toastId.current,
      });
    }
  }

  return (
    <DropdownMenuComponent.DropdownMenu>
      <DropdownMenuComponent.DropdownMenuTrigger>
        <AvatarComponent.Avatar>
          <AvatarComponent.AvatarFallback>
            {user.name.at(0)}
          </AvatarComponent.AvatarFallback>
          {user.image && <AvatarComponent.AvatarImage src={user.image} />}
        </AvatarComponent.Avatar>
      </DropdownMenuComponent.DropdownMenuTrigger>
      <DropdownMenuComponent.DropdownMenuContent
        className="w-48"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuComponent.DropdownMenuItem>
          <UserIcon weight="duotone" />
          Profile
        </DropdownMenuComponent.DropdownMenuItem>
        <DropdownMenuComponent.DropdownMenuSeparator />
        <DropdownMenuComponent.DropdownMenuItem
          onClick={handleSignOut}
          variant="destructive"
        >
          <SignOutIcon />
          Sign out
        </DropdownMenuComponent.DropdownMenuItem>
      </DropdownMenuComponent.DropdownMenuContent>
    </DropdownMenuComponent.DropdownMenu>
  );
}
