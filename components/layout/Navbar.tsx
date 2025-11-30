"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../ModeToggle";
import { ProfileMenu } from "./ProfileMenu";
import { getSessionData } from "@/api/auth/actions";

import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { logoutAction } from "@/api/auth/actions";

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => getSessionData(),
  });

  const navLinks = [
    { href: "/books", label: "Books Shop" },
    { href: "/my-books", label: "My Books" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <nav className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/books" className="flex items-center space-x-2">
          <span className="text-xl font-extrabold text-primary tracking-tight">📚 BookShop</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center justify-between space-x-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Button key={link.href} asChild variant={isActive ? "secondary" : "outline"}>
                <Link
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-primary",
                    isActive && "text-primary font-semibold",
                  )}
                >
                  {link.label}
                </Link>
              </Button>
            );
          })}
        </div>
        <div className="hidden md:flex items-center justify-between space-x-6 text-sm font-medium">
          {/* Desktop Profile Menu */}
          {user && (
            <>
              <ModeToggle />
              <ProfileMenu user={user} />
            </>
          )}
        </div>

        {/* Mobile Icons */}
        <div className="flex items-center md:hidden">
          <ModeToggle />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-64 p-6">
              <div className="flex flex-col items-start space-y-4">
                {/* Mobile Header: Avatar + Name */}
                {user && (
                  <div className="flex items-center gap-3 w-full border-b pb-4 mb-4">
                    <Avatar className="h-10 w-10">
                      {user.image ? (
                        <AvatarImage src={user.image} alt={user.name} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm truncate">{user.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </div>
                )}

                {/* Mobile Nav Links */}
                <nav className="flex flex-col w-full space-y-2">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "text-lg font-medium w-full py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800 hover:rounded-lg",
                          isActive && "font-semibold border rounded-lg",
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Profile Actions */}
                {user && (
                  <div className="pt-4 border-t w-full flex flex-col space-y-2">
                    <Link
                      href="/profile"
                      className={cn(
                        "text-lg font-medium w-full py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800 hover:rounded-lg",
                        pathname === "/profile" && "font-semibold border rounded-lg",
                      )}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/profile/edit"
                      className={cn(
                        "text-lg font-medium w-full py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800 hover:rounded-lg",
                        pathname === "/profile/edit" && "font-semibold border rounded-lg",
                      )}
                    >
                      Edit Profile
                    </Link>
                    <form action={logoutAction} className="w-full">
                      <button
                        type="submit"
                        className="w-full text-left text-red-600 hover:text-red-700 py-2 px-2 rounded hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
