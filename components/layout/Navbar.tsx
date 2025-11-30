"use client";

import Link from "next/link";
import { ProfileMenu } from "./ProfileMenu";
import { getSessionData } from "@/api/auth";
import { ModeToggle } from "../ModeToggle";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const pathname = usePathname();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getSessionData(),
  });

  const navLinks = [
    { href: "/books", label: "Books Shop" },
    { href: "/my-books", label: "My Books" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <nav className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/books" className="flex items-center space-x-2">
          <span className="text-xl font-extrabold text-primary tracking-tight">📚 BookShop</span>
        </Link>

        <div className="hidden md:flex space-x-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            console.log({ pathname, link: link.href, isActive });

            return (
              <Button key={link.href} asChild variant={isActive ? "secondary" : "outline"}>
                <Link
                  key={link.href}
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

        <div className="flex items-center space-x-2">
          <ModeToggle />
          <ProfileMenu user={user} />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
