import Link from "next/link";
import { ProfileMenu } from "./ProfileMenu";
import { getSessionData } from "@/api/auth";
import { ModeToggle } from "../ModeToggle";

const Navbar = async () => {
  const user = await getSessionData();

  const navLinks = [
    { href: "/books", label: "Books Shop" },
    { href: "/my-books", label: "My Books" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <nav className=" flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/books" className="flex items-center space-x-2">
          <span className="text-xl font-extrabold text-primary tracking-tight">📚 BookShop</span>
        </Link>

        <div className="hidden md:flex space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
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
