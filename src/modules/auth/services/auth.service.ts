// src/modules/auth/services/auth.service.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { comparePassword } from "@/lib/hash";
import { getUserByEmail, getUserById } from "@/modules/users/services/user.service";


const SESSION_COOKIE = "auth_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function login(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  const isValid = await comparePassword(password, user.password);
  if (!isValid) throw new Error("Invalid credentials");

  (await cookies()).set(SESSION_COOKIE, String(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    sameSite: "lax",
    path: "/",
  });

  return user;
}

export async function getCurrentUser() {
  const userId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  return await getUserById( userId); // Extend user.service to support byId
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
