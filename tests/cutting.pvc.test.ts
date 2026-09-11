import { test } from "node:test";
import assert from "node:assert/strict";
import { cutPvc, costPvc } from "../src/lib/cutting/pvc.ts";

// knowledge/16_PVC_CUTS_COSTING.md §10 — Κοπές (W=1205, H=2215)
test("PVC κοπές — μονόφυλλο/διφύλλο, W=1205 H=2215", () => {
  const mono = cutPvc({ typology: "MONOFYLLO", W: 1205, H: 2215 });
  assert.deepEqual(mono.frame, { width: 1211, height: 2221 });
  assert.deepEqual(mono.leaf, { width: 1139, height: 2149 });
  assert.deepEqual(mono.glass, { width: 1003, height: 2013 });

  const di = cutPvc({ typology: "DIFYLLO", W: 1205, H: 2215 });
  assert.equal(di.leaves?.[0].width, 568.5);
  assert.equal(di.glasses?.[0].width, 432.5);
  assert.equal(di.glasses?.[0].height, 2013);
});

// §10 — Κοστολόγηση (W=1000, H=1100, τιμή τζαμιού=50€/m²), ενεργός κανόνας τζαμιού (−136)
test("PVC κοστολόγηση ΣΤΑΘΕΡΟ — W=1000 H=1100 τζάμι 50€/m²", () => {
  const r = costPvc({ typology: "STATHERO", W: 1000, H: 1100, glassPriceEurPerM2: 50 });
  assert.equal(r.materialsCost, 99.5412);
  assert.equal(r.wholesalePrice, 179.5412);
  assert.equal(r.retailPrice, 259.5412);
});

test("PVC κοστολόγηση ΜΟΝΟΦΥΛΛΟ — W=1000 H=1100 τζάμι 50€/m²", () => {
  const r = costPvc({ typology: "MONOFYLLO", W: 1000, H: 1100, glassPriceEurPerM2: 50 });
  const glassLine = r.lines.find((l) => l.material === "ΤΖΑΜΙ")!;
  assert.equal(glassLine.cost, 35.8302);
  assert.equal(r.materialsCost, 168.7364);
  assert.equal(r.wholesalePrice, 248.7364);
  assert.equal(r.retailPrice, 328.7364);
});

test("PVC κοστολόγηση ΔΙΦΥΛΛΟ — W=1000 H=1100 τζάμι 50€/m²", () => {
  const r = costPvc({ typology: "DIFYLLO", W: 1000, H: 1100, glassPriceEurPerM2: 50 });
  const glassLine = r.lines.find((l) => l.material === "ΤΖΑΜΙ")!;
  assert.equal(glassLine.cost, 29.634);
  assert.equal(r.materialsCost, 215.055);
  assert.equal(r.wholesalePrice, 325.055);
  assert.equal(r.retailPrice, 465.055);
});

test("PVC ΔΙΦΥΛΛΟ κοπή — κάθετο στοιχείο H-153 επισημαίνεται ως PENDING ονομασία", () => {
  const r = cutPvc({ typology: "DIFYLLO", W: 1000, H: 1100 });
  assert.equal(r.midElement?.length, 947); // H-153 = 1100-153
  assert.ok(r.warnings.some((w) => w.includes("PENDING")));
});
