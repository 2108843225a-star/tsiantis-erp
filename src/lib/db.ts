import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton — αποφεύγει να ανοίγουν νέες συνδέσεις σε κάθε
 * hot-reload στο dev, και είναι το ΜΟΝΟ σημείο που η εφαρμογή μιλάει
 * απευθείας στη βάση. Το service layer (src/lib/services/*) θα περάσει
 * από εδώ όταν συνδεθεί με πραγματικό Repository (βλ.
 * src/lib/repository/types.ts) αντί για το InMemoryRepository των tests.
 */
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
