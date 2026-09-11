/**
 * ΤΣΙΑΝΤΗΣ ERP — Business Rule Engine: core types.
 *
 * Every professional rule used anywhere in the system (cutting formula,
 * price/discount logic, VAT handling, etc.) must be represented as a
 * BusinessRule record with these fields, per the owner's explicit spec:
 * RULE_ID, CATEGORY, SYSTEM, TYPOLOGY, VARIABLES, FORMULA, SOURCE, STATUS,
 * VERSION, VALID_FROM, VALID_TO, VERIFICATION_STATE, UPDATED_BY, UPDATED_AT.
 *
 * A rule's FORMULA field is the human-readable formula, kept for audit and
 * display. The actual computation is a versioned TypeScript function in
 * src/lib/cutting/* or src/lib/pricing/*, registered against the same
 * RULE_ID so the two can never silently drift apart — see registry.ts.
 */

export type RuleStatus = "VERIFIED" | "USER_VERIFIED" | "PENDING" | "SUPERSEDED";

export type RuleCategory =
  | "CUTTING"
  | "GLASS"
  | "PRICING"
  | "DISCOUNT"
  | "VAT"
  | "COSTING"
  | "OTHER";

export interface BusinessRule {
  RULE_ID: string;
  CATEGORY: RuleCategory;
  SYSTEM: string; // π.χ. "EUROPA_850", "PVC", "GENERAL"
  TYPOLOGY: string; // π.χ. "ΜΟΝΟΦΥΛΛΟ", "ΔΙΦΥΛΛΟ", "ΣΤΑΘΕΡΟ", "N/A"
  VARIABLES: string[]; // ονόματα μεταβλητών εισόδου, π.χ. ["W", "H"]
  FORMULA: string; // ανθρώπινα αναγνώσιμη φόρμουλα, για audit/εμφάνιση
  SOURCE: string; // πηγή αλήθειας (αρχείο knowledge base / συζήτηση με Φίλιππο)
  STATUS: RuleStatus;
  VERSION: number;
  VALID_FROM: string; // ISO date
  VALID_TO: string | null; // null = ακόμα ισχύει
  VERIFICATION_STATE: string; // ελεύθερο κείμενο, π.χ. "CONFIRMED 10/09 από Φίλιππο"
  UPDATED_BY: string; // "PHILIPPOS" | "CLAUDE" | user id
  UPDATED_AT: string; // ISO datetime
}

/** Thrown whenever code is asked to calculate with a rule that is not VERIFIED/USER_VERIFIED. */
export class UnverifiedRuleError extends Error {
  ruleId: string;
  reason: string;

  constructor(ruleId: string, reason: string) {
    super(`Κανόνας "${ruleId}" δεν είναι επιβεβαιωμένος — ${reason}`);
    this.name = "UnverifiedRuleError";
    this.ruleId = ruleId;
    this.reason = reason;
  }
}

/** Guard used by every calculation entrypoint before it runs a formula. */
export function assertUsable(rule: BusinessRule): void {
  if (rule.STATUS !== "VERIFIED" && rule.STATUS !== "USER_VERIFIED") {
    throw new UnverifiedRuleError(
      rule.RULE_ID,
      `κατάσταση=${rule.STATUS}. Ζήτα επιβεβαίωση από τον Φίλιππο πριν υπολογίσεις.`
    );
  }
  if (rule.VALID_TO && new Date(rule.VALID_TO).getTime() < Date.now()) {
    throw new UnverifiedRuleError(rule.RULE_ID, "ο κανόνας έχει λήξει (VALID_TO στο παρελθόν).");
  }
}
