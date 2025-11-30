"use server";

import { cookies } from "next/headers";
import { User } from "@/types";
import { readJson } from "@/lib/helper/readJson";
import { writeJson } from "@/lib/helper/writeJson";

type UpdateResult = User | { error: string };

export async function updateProfileAction(data: {
  name: string;
  email: string;
}): Promise<UpdateResult | null> {
  const cookie = (await cookies()).get("auth");

  if (!cookie) {
    return { error: "Authentication cookie not found." };
  }

  const userId = cookie?.value;

  let users: User[];
  try {
    users = await readJson<User[]>("users.json");
  } catch (err) {
    return { error: "Failed to read user data file." };
  }

  const index = users.findIndex((u) => String(u.id) === String(userId));
  if (index === -1) {
    return { error: `User with ID ${userId} not found.` };
  }

  const existingUser = users[index];

  const updatedUser: User = {
    ...existingUser,
    name: data.name ?? existingUser.name,
    email: data.email ?? existingUser.email,
  };

  try {
    users[index] = updatedUser;
    await writeJson("users.json", users);
  } catch (err) {
    return { error: "Failed to save updated user data." };
  }

  return updatedUser;
}
