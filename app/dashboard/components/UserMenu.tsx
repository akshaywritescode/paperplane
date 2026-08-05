"use client";

import { logOut } from "@/app/dashboard/actions";
import { ChevronsUpDown, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  name?: string;
  email?: string;
};

function getAvatarUrl(seed: string) {
  const encoded = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encoded}&backgroundColor=f97316&shapeColor=ffffff`;
}

export function UserMenu({ name, email }: UserMenuProps) {
  const seed = email || name || "paperplane";
  const avatarUrl = getAvatarUrl(seed);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent outline-none"
      >
        {/* DiceBear avatar */}
        <img
          src={avatarUrl}
          alt={name || "User avatar"}
          className="size-8 shrink-0 rounded-lg bg-orange-100"
        />
        <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate text-sm font-medium text-sidebar-foreground">
            {name || "User"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {email || ""}
          </span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        className="w-56"
        sideOffset={4}
      >
        {/* User info header — plain div, not a label, to avoid Base UI Group context requirement */}
        <div className="flex items-center gap-3 px-2 py-2">
          <img
            src={avatarUrl}
            alt=""
            className="size-9 rounded-lg bg-orange-100"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {name || "User"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {email || ""}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<a href="/dashboard/settings" />}>
          <User className="size-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action={logOut} className="w-full">
          <DropdownMenuItem
            className="text-destructive w-full cursor-pointer"
            render={<button type="submit" className="w-full" />}
          >
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
