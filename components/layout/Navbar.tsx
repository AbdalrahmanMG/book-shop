import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { User } from "@/types";

const Navbar = async () => {
  // Mock data will be deleted soon
  const user: User = {
    id: 1,
    name: "Admin",
    email: "admin@books.com",
    password: "admin123",
    image: "/berry1.png",
  };

  return (
    <nav className="w-full flex justify-between items-center p-4 bg-gray-100 shadow">
      {/* Logo */}
      <Link href="/">
        <p className="text-xl font-bold cursor-pointer">Book Shop</p>
      </Link>

      {/* User Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar>
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : (
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="font-medium">{user.name}</span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Link href="/profile">My Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/profile/edit">Edit Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <button type="submit">Logout</button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default Navbar;
