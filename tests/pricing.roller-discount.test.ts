import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateNetPurchasePrice } from "../src/lib/pricing/price-engine.ts";

// knowledge/15_PRICING_VARIABLES.md — παράδειγμα 100€ → 6% έκπτωση → 94€
test("Ρολό με έκπτωση — 100€ καταλόγου, 6% → 94€ καθαρή τιμή", () => {
  const r = calculateNetPurchasePrice({
    sku: "TEST-ITEM",
    catalogPrice: 100,
    discountAllowed: true,
    priceSource: "Τιμοκατάλογος ρολού 2024",
  });
  assert.equal(r.DISCOUNT_PERCENT, 6);
  assert.equal(r.DISCOUNT_AMOUNT, 6);
  assert.equal(r.NET_PURCHASE_PRICE, 94);
});

// Εξαίρεση με ρητό DISCOUNT_ALLOWED=false στο SKU
test("Εξαιρούμενο SKU 141-1899ET — 0% έκπτωση, πλήρης τιμή 14,55€", () => {
  const r = calculateNetPurchasePrice({
    sku: "141-1899ET",
    catalogPrice: 14.55,
    discountAllowed: true, // ακόμα κι αν δεν έχει σημειωθεί ρητά, το SKU exclusion υπερισχύει
    priceSource: "40x20 οδηγός αλουμινίου",
  });
  assert.equal(r.DISCOUNT_PERCENT, 0);
  assert.equal(r.NET_PURCHASE_PRICE, 14.55);
  assert.equal(r.DISCOUNT_ALLOWED, false);
});

// Ιστορικό snapshot: παλιά κοστολόγηση με ΠΑΛΙΟ ποσοστό δεν αλλάζει όταν αλλάζει η μεταβλητή
test("Ιστορικό snapshot διατηρεί το ποσοστό που ίσχυε τότε, όχι το τρέχον", () => {
  const historical = calculateNetPurchasePrice(
    { sku: "OLD-ITEM", catalogPrice: 200, discountAllowed: true, priceSource: "τιμοκατάλογος 2024" },
    { asOfDate: "2025-01-15", discountPercentOverride: 10 }
  );
  assert.equal(historical.DISCOUNT_PERCENT, 10);
  assert.equal(historical.NET_PURCHASE_PRICE, 180);
  assert.equal(historical.PRICE_DATE, "2025-01-15");
});
