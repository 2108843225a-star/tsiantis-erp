import {
  type Repository,
  type ProjectRecord,
  type PaymentRecord,
  type QuoteRecord,
  type AuditRecord,
  OptimisticLockError,
} from "./types.ts";

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

/**
 * In-memory Repository — για tests και τοπική ανάπτυξη χωρίς πραγματική
 * βάση δεδομένων. Η production υλοποίηση (Prisma/Postgres) υλοποιεί το
 * ΙΔΙΟ interface· το service layer δεν αλλάζει καθόλου.
 */
export class InMemoryRepository implements Repository {
  projects = new Map<string, ProjectRecord>();
  payments: PaymentRecord[] = [];
  quotes: QuoteRecord[] = [];
  auditLog: AuditRecord[] = [];

  seedProject(p: ProjectRecord) {
    this.projects.set(p.id, p);
  }

  async getProject(id: string): Promise<ProjectRecord | null> {
    return this.projects.get(id) ?? null;
  }

  async updateProjectVersion(id: string, expectedVersion: number): Promise<void> {
    const p = this.projects.get(id);
    if (!p) throw new Error(`Άγνωστο έργο: ${id}`);
    if (p.version !== expectedVersion) throw new OptimisticLockError("Project", id);
    p.version += 1;
  }

  async listPayments(projectId: string): Promise<PaymentRecord[]> {
    return this.payments.filter((p) => p.projectId === projectId);
  }

  async createPayment(payment: Omit<PaymentRecord, "id">): Promise<PaymentRecord> {
    const record: PaymentRecord = { ...payment, id: nextId("pay") };
    this.payments.push(record);
    return record;
  }

  async createQuote(quote: Omit<QuoteRecord, "id" | "version">): Promise<QuoteRecord> {
    const record: QuoteRecord = { ...quote, id: nextId("quote"), version: 1 };
    this.quotes.push(record);
    return record;
  }

  async updateQuote(
    id: string,
    expectedVersion: number,
    patch: Partial<QuoteRecord>
  ): Promise<QuoteRecord> {
    const record = this.quotes.find((q) => q.id === id);
    if (!record) throw new Error(`Άγνωστη προσφορά: ${id}`);
    if (record.version !== expectedVersion) throw new OptimisticLockError("Quote", id);
    Object.assign(record, patch, { version: record.version + 1 });
    return record;
  }

  async appendAudit(entry: Omit<AuditRecord, "id">): Promise<AuditRecord> {
    const record: AuditRecord = { ...entry, id: nextId("audit") };
    this.auditLog.push(record);
    return record;
  }
}
