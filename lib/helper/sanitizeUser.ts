import { User } from "@/types";

export function sanitizeUser(user: User) {
  const { password: _, ...safe } = user;
  return safe;
}
