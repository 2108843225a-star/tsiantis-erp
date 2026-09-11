"use server";

import { prisma } from "@/lib/db";
import { verifyPassword } from "./password";
import { signSession } from "./session";
import { SESSION_COOKIE } from "./current-user";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user || !user.active) {
    redirect("/login?error=1");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    redirect("/login?error=1");
  }

  const token = await signSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + THIRTY_DAYS,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  redirect("/");
}

export async function logoutAction() {
  (await cookies()).set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  redirect("/login");
}
