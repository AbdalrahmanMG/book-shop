"use server";

import { cookies } from "next/headers";
import { User } from "@/types";
import { redirect } from "next/navigation";
import { LoginSchema } from "@/validation/auth";
import mockUsers from "@/db/users.json";

export async function loginAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());

  const validation = LoginSchema.safeParse(data);

  if (!validation.success) {
    return {
      error: "Validation Failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }
  const { email, password } = validation.data;

  const users: User[] = mockUsers as User[];

  const user = users.find((user: User) => user.email === email && user.password === password);

  if (!user) {
    return { error: "Invalid credentials" };
  }

  const cookiesStore = await cookies();

  cookiesStore.set("auth", String(user.id), {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax" as const,
  });

  redirect("/books");
}
