"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requirePermission, type CallContext } from "@/lib/services/context";

/**
 * Write ενέργεια πάνω σε πραγματική βάση δεδομένων, τώρα με πραγματικό
 * session (όχι πλέον "προσωρινό μονοπάτι χωρίς RBAC" — το login συνδέθηκε).
 * Το CallContext είναι το ΙΔΙΟ που θα χρησιμοποιεί αργότερα και το
 * ενσωματωμένο Claude μέσω MCP (src/lib/services/context.ts) — καμία πίσω
 * πόρτα, ο έλεγχος δικαιωμάτων είναι κοινός.
 */
export async function createCustomer(formData: FormData) {
  const session = await getCurrentUser();
  if (!session) {
    throw new Error("Χρειάζεται σύνδεση.");
  }

  const ctx: CallContext = {
    actorType: "USER",
    actor: session.userId,
    role: session.role,
    source: "web-app:customers",
  };
  requirePermission(ctx, "customers.write");

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
