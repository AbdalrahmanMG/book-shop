"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_COOKIE_NAME = "auth";

export async function logoutAction() {
  const cookiesStore = await cookies();

  cookiesStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}
