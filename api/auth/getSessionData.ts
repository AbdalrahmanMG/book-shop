"use server";

import { cookies } from "next/headers";
import { User, SafeUserData } from "@/types";
import { sanitizeUser } from "@/lib/helper/sanitizeUser";
import { readJson } from "@/lib/helper/readJson";

const AUTH_COOKIE_NAME = "auth";

export async function getSessionData(): Promise<SafeUserData | null> {
  const cookiesStore = await cookies();
  const userId = cookiesStore.get(AUTH_COOKIE_NAME)?.value;

  if (!userId) {
    return null;
  }

  try {
    const users = await readJson<User[]>("users.json");
    const user = users.find((u: User) => String(u.id) === String(userId));

    if (!user) {
      cookiesStore.delete(AUTH_COOKIE_NAME);
      return null;
    }

    return sanitizeUser(user);
  } catch (error) {
    console.error("Error reading users file or finding user:", error);
    cookiesStore.delete(AUTH_COOKIE_NAME);
    return null;
  }
}
