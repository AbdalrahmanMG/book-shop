"use server";

import { cookies } from "next/headers";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";

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

  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (fetchError || !existingUser) {
    return { error: `User with ID ${userId} not found.` };
  }

  const updatedUser = {
    name: data.name ?? existingUser.name,
    email: data.email ?? existingUser.email,
  };

  const { data: updated, error } = await supabase
    .from("users")
    .update(updatedUser)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update user:", error);
    return { error: "Failed to save updated user data." };
  }

  return updated;
}
