/**
 * Price Engine — καθαρή τιμή αγοράς, μεταβλητές εκπτώσεις, ιστορικά snapshots.
 *
 * Απαίτηση Φίλιππου (knowledge/15_PRICING_VARIABLES.md): η έκπτωση
 * τιμοκαταλόγου ρολών (σήμερα 6%) είναι ΜΕΤΑΒΛΗΤΗ, αλλάζει από ΕΝΑ σημείο
 * (βλ. PricingVariable στο schema.prisma / CURRENT_PRICING_VARIABLES εδώ),
 * και ΚΑΘΕ κοστολόγηση κρατάει το δικό της snapshot — αλλαγή της
 * μεταβλητής ΔΕΝ ξαναγράφει παλιότερες προσφορές/παραγγελίες.
 */

import { assertUsable } from "../rules/types.ts";
import { getRule } from "../rules/registry.ts";

/**
 * Τρέχουσες τιμές μεταβλητών εμπορικών όρων. Σε παραγωγή αυτό ζει στον
 * πίνακα PricingVariable (βλ. prisma/schema.prisma) με πλήρες ιστορικό
 * αλλαγών (ποιος/πότε άλλαξε τι) — αυτό το αντικείμενο είναι το seed/
 * fallback και το σχήμα που καταναλώνει ο κώδικας.
 */
export const CURRENT_PRICING_VARIABLES = {
  ROLLER_CATALOG_DISCOUNT_PERCENT: 6,
} as const;

export interface DiscountLineAudit {
  CATALOG_PRICE: number;
  DISCOUNT_ALLOWED: boolean;
  DISCOUNT_PERCENT: number;
  DISCOUNT_AMOUNT: number;
  NET_PURCHASE_PRICE: number;
  PRICE_DATE: string; // ISO date, στιγμή κοστολόγησης
  PRICE_SOURCE: string;
}

export interface RollerCatalogItem {
  sku: string;
  catalogPrice: number;
  /** true αν επιτρέπεται έκπτωση σε αυτό το item (π.χ. false για μηχανισμούς ή SKU με ρητή εξαίρεση). */
  discountAllowed: boolean;
  priceSource: string;
}

/** Γνωστές εξαιρέσεις από την έκπτωση — knowledge/15_PRICING_VARIABLES.md "Πού ΔΕΝ εφαρμόζεται". */
export const DISCOUNT_EXCLUDED_SKUS = new Set<string>([
  "141-1899ET", // οδηγός αλουμινίου 40x20 — DISCOUNT_ALLOWED=ΟΧΙ, ανεξάρτητο από τη μεταβλητή
]);

/**
 * Υπολογίζει την καθαρή τιμή αγοράς ενός item τιμοκαταλόγου ρολού, με
 * πλήρες audit trail. discountPercentOverride επιτρέπει σε ιστορικές
 * αναπαραγωγές να περάσουν το ΠΑΛΙΟ ποσοστό που ίσχυε τότε (snapshot),
 * αντί για το τρέχον — ποτέ μην ξαναϋπολογίζεις παλιά κοστολόγηση με τη
 * σημερινή τιμή της μεταβλητής.
 */
export function calculateNetPurchasePrice(
  item: RollerCatalogItem,
  opts: { asOfDate?: string; discountPercentOverride?: number } = {}
): DiscountLineAudit {
  const rule = getRule("ROLLER_CATALOG_DISCOUNT");
  assertUsable(rule);

  const isExcluded = !item.discountAllowed || DISCOUNT_EXCLUDED_SKUS.has(item.sku);
  const discountPercent = isExcluded
    ? 0
    : opts.discountPercentOverride ?? CURRENT_PRICING_VARIABLES.ROLLER_CATALOG_DISCOUNT_PERCENT;

  const discountAmount = round2((item.catalogPrice * discountPercent) / 100);
  const netPurchasePrice = round2(item.catalogPrice - discountAmount);

  return {
    CATALOG_PRICE: item.catalogPrice,
    DISCOUNT_ALLOWED: !isExcluded,
    DISCOUNT_PERCENT: discountPercent,
    DISCOUNT_AMOUNT: discountAmount,
    NET_PURCHASE_PRICE: netPurchasePrice,
    PRICE_DATE: opts.asOfDate ?? new Date().toISOString().slice(0, 10),
    PRICE_SOURCE: item.priceSource,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
