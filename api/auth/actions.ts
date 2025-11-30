"use server";

import { cookies } from "next/headers";
import { User, SafeUserData } from "@/types";
import { sanitizeUser } from "@/lib/helper/sanitizeUser";
import { readJson } from "@/lib/helper/readJson";
import { redirect } from "next/navigation";
import { LoginSchema } from "@/validation/auth";
import mockUsers from "@/db/users.json";

const AUTH_COOKIE_NAME = "auth";

export type FieldErrors = {
  [key: string]: string[] | undefined;
};

export type ErrorResponse = {
  error: string;
  fieldErrors?: FieldErrors;
};

export type LoginActionResponse = ErrorResponse | void;

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

export async function loginAction(formData: FormData): Promise<LoginActionResponse> {
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

export async function logoutAction() {
  const cookiesStore = await cookies();

  cookiesStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}
