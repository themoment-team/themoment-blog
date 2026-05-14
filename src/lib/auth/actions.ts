"use server";

import { signIn, signOut } from "@/lib/auth";

export async function loginWithDataGSM() {
  await signIn("datagsm", { redirectTo: "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
