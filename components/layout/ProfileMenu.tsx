// src/components/layout/ProfileMenu.tsx
// يجب أن يكون CLIENT COMPONENT لاحتوائه على DropdownMenu

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
  user: SafeUserData;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ user }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-3 data-[state=open]:bg-gray-100/70">
          <Avatar className="h-8 w-8 mr-2">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.name.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>

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
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <span className="ml-2">My Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile/edit" className="flex items-center">
            <span className="ml-2">Edit Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <form action={logoutAction}>
            <button className="w-full text-left text-red-600 focus:text-red-700" type="submit">
              Logout
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
