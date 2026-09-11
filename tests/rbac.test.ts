import { test } from "node:test";
import assert from "node:assert/strict";
import { can } from "../src/lib/rbac/roles.ts";

test("OWNER_ADMIN βλέπει τιμές αγοράς και κέρδος", () => {
  assert.equal(can("OWNER_ADMIN", "pricing.view_purchase_prices"), true);
  assert.equal(can("OWNER_ADMIN", "pricing.view_margin"), true);
});

test("TECHNICIAN δεν βλέπει τιμές αγοράς ή κέρδος by default", () => {
  assert.equal(can("TECHNICIAN", "pricing.view_purchase_prices"), false);
  assert.equal(can("TECHNICIAN", "pricing.view_margin"), false);
});

test("TECHNICIAN μπορεί να καταχωρήσει μέτρηση αλλά όχι πελάτη", () => {
  assert.equal(can("TECHNICIAN", "measurements.write"), true);
  assert.equal(can("TECHNICIAN", "customers.write"), false);
});

test("Ρητό grant override δίνει σε συγκεκριμένο τεχνικό πρόσβαση σε τιμές", () => {
  assert.equal(
    can("TECHNICIAN", "pricing.view_purchase_prices", { grant: ["pricing.view_purchase_prices"] }),
    true
  );
});

test("SECRETARY δεν έχει δικαίωμα αλλαγής business rule ή pricing variable", () => {
  assert.equal(can("SECRETARY", "business_rules.write"), false);
  assert.equal(can("SECRETARY", "pricing_variables.write"), false);
});
