/**
 * Repository interfaces — το service layer μιλάει ΜΟΝΟ σε αυτά τα
 * interfaces, ποτέ απευθείας σε Prisma. Έτσι:
 *   - το ίδιο service layer τρέχει tests με μια απλή in-memory υλοποίηση
 *     (χωρίς πραγματική βάση δεδομένων/χωρίς npm install — βλ.
 *     in-memory.ts) ΚΑΙ σε παραγωγή με πραγματικό Postgres/Prisma, χωρίς
 *     να αλλάξει η λογική·
 *   - είναι ξεκάθαρο ποιο "πόρτα" έχει το Claude/το API προς τη βάση —
 *     καμία ελεύθερη πρόσβαση.
 */

export interface ProjectRecord {
  id: string;
  code: string;
  customerId: string;
  agreedAmount: number | null;
  version: number;
}

export interface PaymentRecord {
  id: string;
  projectId: string;
  amount: number;
  paidAt: string;
  recordedById: string;
}

export interface QuoteRecord {
  id: string;
  projectId: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  customerTotal: number;
  internalCost: number;
  marginPercent: number;
  createdById: string;
  version: number;
}

export interface AuditRecord {
  id: string;
  actorType: "USER" | "AI" | "SYSTEM";
  actor: string;
  action: string;
  before: unknown | null;
  after: unknown | null;
  at: string;
  source: string;
  relatedProjectId: string | null;
  relatedCustomerId: string | null;
}

export interface Repository {
  getProject(id: string): Promise<ProjectRecord | null>;
  updateProjectVersion(id: string, expectedVersion: number): Promise<void>; // πετάει σε version mismatch (optimistic locking)

  listPayments(projectId: string): Promise<PaymentRecord[]>;
  createPayment(payment: Omit<PaymentRecord, "id">): Promise<PaymentRecord>;

  createQuote(quote: Omit<QuoteRecord, "id" | "version">): Promise<QuoteRecord>;
  updateQuote(id: string, expectedVersion: number, patch: Partial<QuoteRecord>): Promise<QuoteRecord>;

  appendAudit(entry: Omit<AuditRecord, "id">): Promise<AuditRecord>;
}

export class OptimisticLockError extends Error {
  constructor(entity: string, id: string) {
    super(
      `Κάποιος άλλος (χρήστης ή Claude) άλλαξε "${entity}" (${id}) στο μεταξύ — ξαναδιάβασε και ξαναπροσπάθησε.`
    );
    this.name = "OptimisticLockError";
  }
}
