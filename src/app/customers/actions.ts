"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Πρώτη πραγματική write ενέργεια πάνω σε πραγματική βάση δεδομένων.
 * Ακολουθεί προσωρινά απλοποιημένο μονοπάτι (χωρίς RBAC/audit layer ακόμα
 * — αυτά υπάρχουν έτοιμα στο src/lib/services/ για όταν συνδεθεί login).
 */
export async function createCustomer(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!firstName || !lastName) {
    throw new Error("Χρειάζεται τουλάχιστον όνομα και επώνυμο.");
  }

  await prisma.customer.create({
    data: {
      firstName,
      lastName,
      phone: phone || null,
      location: location || null,
    },
  });

  revalidatePath("/customers");
}
