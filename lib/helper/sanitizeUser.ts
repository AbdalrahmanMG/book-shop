import { User } from "@/types";

export function sanitizeUser(user: User) {
  const { password, ...safe } = user;
  return safe;
}
