"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { SafeUserData } from "@/types";
import { logoutAction } from "@/api/auth";

interface ProfileMenuProps {
  user?: SafeUserData | null;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ user }) => {
  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-10 px-3 rounded-md hover:bg-gray-100/70 focus-visible:ring-0"
        >
          <Avatar className="h-8 w-8">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Hide name/email on mobile */}
          <div className="hidden sm:flex flex-col items-start min-w-0">
            <span className="font-semibold text-sm truncate max-w-[150px]">{user.name}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {user.email}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="font-semibold">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">My Profile</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile/edit">Edit Profile</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <form action={logoutAction}>
            <button type="submit" className="w-full text-left text-red-600 hover:text-red-700">
              Logout
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
