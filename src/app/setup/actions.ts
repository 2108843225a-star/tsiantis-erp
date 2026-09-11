"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { redirect } from "next/navigation";

export async function createFirstAdmin(formData: FormData) {
  const existing = await prisma.user.count();
  if (existing > 0) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    redirect("/setup?error=1");
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name, email, role: "OWNER_ADMIN", passwordHash },
  });

  redirect("/login");
}
