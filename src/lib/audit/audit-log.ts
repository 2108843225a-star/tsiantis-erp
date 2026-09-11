/**
 * Audit Log — πλήρες ιστορικό WHO/WHAT/BEFORE/AFTER/WHEN/SOURCE.
 *
 * Κάθε write ενέργεια στο ERP API layer (δημιουργία/αλλαγή πελάτη, έργου,
 * κουφώματος, προσφοράς, παραγγελίας, πληρωμής, κανόνα, μεταβλητής τιμών)
 * περνάει από buildAuditEntry() πριν αποθηκευτεί. Σε παραγωγή τα entries
 * γράφονται στον πίνακα AuditLog (schema.prisma) — append-only, ποτέ
 * delete/update.
 */

export type ActorType = "USER" | "AI" | "SYSTEM";

export interface AuditEntry {
  id?: string;
  actorType: ActorType;
  actor: string; // user id, ή "CLAUDE", ή "SYSTEM"
  action: string; // π.χ. "quote.create", "pricing_variable.update"
  before: unknown | null;
  after: unknown | null;
  at: string; // ISO datetime
  source: string; // π.χ. "web-app", "mcp:update_business_rule", "api"
  relatedProjectId?: string | null;
  relatedCustomerId?: string | null;
}

export function buildAuditEntry(params: {
  actorType: ActorType;
  actor: string;
  action: string;
  before: unknown | null;
  after: unknown | null;
  source: string;
  relatedProjectId?: string;
  relatedCustomerId?: string;
}): AuditEntry {
  return {
    actorType: params.actorType,
    actor: params.actor,
    action: params.action,
    before: params.before,
    after: params.after,
    at: new Date().toISOString(),
    source: params.source,
    relatedProjectId: params.relatedProjectId ?? null,
    relatedCustomerId: params.relatedCustomerId ?? null,
  };
}

/**
 * Όταν ο ηθοποιός είναι το ενσωματωμένο Claude (μέσω MCP tool call),
 * ΠΑΝΤΑ actorType="AI", actor="CLAUDE" — ποτέ κρυφό πίσω από τον χρήστη
 * που έστειλε το μήνυμα, ώστε το ιστορικό να δείχνει καθαρά ποιος έκανε
 * πραγματικά την αλλαγή.
 */
export function buildAiAuditEntry(
  params: Omit<Parameters<typeof buildAuditEntry>[0], "actorType" | "actor">
): AuditEntry {
  return buildAuditEntry({ ...params, actorType: "AI", actor: "CLAUDE" });
}
