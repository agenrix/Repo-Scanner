import { SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { authClient } from "~/lib/auth/client";
import type { IUser } from "~/types/user.types";
import * as AvatarComponent from "../ui/avatar";
import * as DropdownMenuComponent from "../ui/dropdown-menu";

interface UserAvatarProps {
  user: IUser;
}

export default function UserAvatar({ user }: UserAvatarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toastId = React.useRef<string | number>(undefined);

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onRequest: () => {
          toastId.current = toast.loading("Signing out...");
        },
        onError: ({ error }) => {
          toast.error("Failed to sign out", {
            richColors: true,
            description: error?.message ?? "An unknown error occurred",
            id: toastId.current,
          });
        },
        onSuccess: async () => {
          queryClient.invalidateQueries({ queryKey: ["user", "session"] });

          await navigate({ to: "/login", replace: true });
        },
      },
    });
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
