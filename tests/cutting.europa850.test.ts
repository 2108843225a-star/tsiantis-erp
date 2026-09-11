import { test } from "node:test";
import assert from "node:assert/strict";
import { cutMonofylloEuropa850 } from "../src/lib/cutting/europa-850.ts";

// Παράδειγμα 1 (09_CONFIRMED_EXAMPLES.md): 850 μονόφυλλο χωρίς ρολό, άνοιγμα 1200x1400
test("EUROPA 850 μονόφυλλο χωρίς ρολό — 1200x1400", () => {
  const r = cutMonofylloEuropa850({
    series: "EUROPA_850",
    openingWidth: 1200,
    openingHeight: 1400,
  });
  assert.deepEqual(r.frame, { width: 1200, height: 1400 });
  assert.deepEqual(r.leaf, { width: 1153, height: 1353 });
  assert.deepEqual(r.glass, { width: 1035, height: 1235 });
  assert.equal(r.glassComposition, "4-10-4");
  assert.equal(r.glassMaxThicknessMm, 18);
});

// Παράδειγμα 2: 850 με ρολό, άνοιγμα 1000x1000 — ΣΥΝ ΚΟΥΤΙ / ΟΛΙΚΟ 185 / ΟΛΙΚΟ 145
test("EUROPA 850 με ρολό ΣΥΝ ΚΟΥΤΙ — 1000x1000", () => {
  const r = cutMonofylloEuropa850({
    series: "EUROPA_850",
    openingWidth: 1000,
    openingHeight: 1000,
    roller: { heightMode: "SYN_KOUTI", boxHeight: 185 },
  });
  assert.deepEqual(r.frame, { width: 1003, height: 1000 });
  assert.deepEqual(r.leaf, { width: 956, height: 953 });
  assert.deepEqual(r.glass, { width: 838, height: 835 });
});

test("EUROPA 850 με ρολό ΟΛΙΚΟ 185 — 1000x1000", () => {
  const r = cutMonofylloEuropa850({
    series: "EUROPA_850",
    openingWidth: 1000,
    openingHeight: 1000,
    roller: { heightMode: "OLIKO", boxHeight: 185 },
  });
  assert.deepEqual(r.frame, { width: 1003, height: 815 });
  assert.deepEqual(r.leaf, { width: 956, height: 768 });
  assert.deepEqual(r.glass, { width: 838, height: 650 });
});

test("EUROPA 850 με ρολό ΟΛΙΚΟ 145 — 1000x1000", () => {
  const r = cutMonofylloEuropa850({
    series: "EUROPA_850",
    openingWidth: 1000,
    openingHeight: 1000,
    roller: { heightMode: "OLIKO", boxHeight: 145 },
  });
  assert.deepEqual(r.frame, { width: 1003, height: 855 });
  assert.deepEqual(r.leaf, { width: 956, height: 808 });
  assert.deepEqual(r.glass, { width: 838, height: 690 });
});

// Παράδειγμα 5: καρέ ρολού, άνοιγμα 1000x1000
test("Καρέ ρολού ΣΥΝ ΚΟΥΤΙ (40x20) — 1000x1000", () => {
  const r = cutMonofylloEuropa850({
    series: "EUROPA_850",
    openingWidth: 1000,
    openingHeight: 1000,
    roller: { heightMode: "SYN_KOUTI", boxHeight: 185 },
  });
  assert.equal(r.kareRolou?.profile, "40x20");
  assert.equal(r.kareRolou?.guides.length, 997);
  assert.equal(r.kareRolou?.bottom.length, 957);
});

test("Καρέ ρολού ΟΛΙΚΟ 185 (80x20/100x20) — 1000x1000", () => {
  const r = cutMonofylloEuropa850({
    series: "EUROPA_850",
    openingWidth: 1000,
    openingHeight: 1000,
    roller: { heightMode: "OLIKO", boxHeight: 185 },
  });
  assert.equal(r.kareRolou?.guides.length, 812);
  assert.equal(r.kareRolou?.bottom.length, 957);
});

test("Καρέ ρολού ΟΛΙΚΟ 145 — 1000x1000", () => {
  const r = cutMonofylloEuropa850({
    series: "EUROPA_850",
    openingWidth: 1000,
    openingHeight: 1000,
    roller: { heightMode: "OLIKO", boxHeight: 145 },
  });
  assert.equal(r.kareRolou?.guides.length, 852);
  assert.equal(r.kareRolou?.bottom.length, 957);
});

test("EUROPA 8500 μονόφυλλο — ίδια κοπή με 850, διαφορετικό πάχος τζαμιού", () => {
  const r = cutMonofylloEuropa850({
    series: "EUROPA_8500",
    openingWidth: 1200,
    openingHeight: 1400,
  });
  assert.deepEqual(r.leaf, { width: 1153, height: 1353 });
  assert.equal(r.glassComposition, "4-16-4");
  assert.equal(r.glassMaxThicknessMm, 24);
});

test("Άγνωστη/ανεπιβεβαίωτη σειρά ΔΕΝ υπολογίζεται — πετάει σφάλμα, όχι εικασία", () => {
  assert.throws(
    () =>
      cutMonofylloEuropa850({
        // @ts-expect-error -- σκόπιμα μη υποστηριζόμενη σειρά για το test
        series: "ESS_34",
        openingWidth: 1000,
        openingHeight: 2000,
      }),
    /δεν υποστηρίζεται/
  );
});
