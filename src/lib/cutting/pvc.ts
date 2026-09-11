/**
 * Cut & Cost Engine — PVC / ΠΙΒΙΣΙ.
 *
 * Πηγή: knowledge/16_PVC_CUTS_COSTING.md (κανόνες) +
 * knowledge/17_PVC_RAW_SOURCE_APPENDIX.md (raw formulas ανά κελί, από τα
 * πρωτότυπα ΚΟΠΕΣ ΠΙΒΙΣΙ.xlsm / ΚΟΣΤΟΛΟΓΗΣΗ ΠΙΒΙΣΙ.xlsm).
 *
 * Όλοι οι αριθμοί κοστολόγησης παρακάτω έχουν επαληθευτεί ΓΡΑΜΜΗ ΠΡΟΣ ΓΡΑΜΜΗ
 * ενάντια στα raw κελιά/formulas του πρωτότυπου (όχι μόνο ενάντια στο
 * τελικό σύνολο) και ενάντια στα παραδείγματα §10 του 16_PVC_CUTS_COSTING.md
 * — βλ. tests/cutting.pvc.test.ts. Ο ενεργός κανόνας τζαμιού είναι
 * φύλλο−136 (PVC_GLASS_RULE) — η παλιά φόρμουλα φύλλο−128 είναι SUPERSEDED
 * και ΔΕΝ χρησιμοποιείται πουθενά εδώ.
 *
 * PVC ΔΕΝ είναι το ίδιο προϊόν με το αλουμίνιο EUROPA — ξεχωριστό υλικό,
 * ξεχωριστές τυπολογίες/τιμές (βλ. europa-850.ts).
 */

import { assertUsable } from "../rules/types.ts";
import { getRule } from "../rules/registry.ts";
import type { Rect } from "./europa-850.ts";

export type PvcTypology = "STATHERO" | "MONOFYLLO" | "DIFYLLO";

export interface PvcOpeningInput {
  typology: PvcTypology;
  W: number; // πλάτος ανοίγματος, mm
  H: number; // ύψος ανοίγματος, mm
}

export interface PvcCuttingResult {
  typology: PvcTypology;
  frame: Rect; // κάσα εσωτ. = W+6 x H+6
  leaf?: Rect; // φύλλο (μονόφυλλο) — πλάτος/ύψος ενός φύλλου
  leaves?: Rect[]; // φύλλα (διφύλλο) — 2 τεμ.
  frameSteel: { rect: Rect; qty: number }; // σίδερο κάσας
  leafSteel?: { rect: Rect; qty: number }; // σίδερο φύλλου
  glass?: Rect; // τζάμι σταθερού/μονόφυλλου
  glasses?: Rect[]; // τζάμια διφύλλου (2 τεμ.)
  beading?: Rect | Rect[]; // πιχάκι
  midElement?: { length: number; note: string }; // ΔΙΦΥΛΛΟ: H-153, ονομασία PENDING
  sourceRules: string[];
  warnings: string[];
}

/** €/m τιμοκατάλογος υλικών PVC — knowledge/16_PVC_CUTS_COSTING.md §6. Επεξεργάσιμες, όχι μόνιμες σταθερές. */
export const PVC_MATERIAL_PRICES_EUR_PER_M = {
  KASA: 4.82,
  FYLLO: 5.28,
  MPINI: 6.32,
  PIXAKI: 0.96,
  SIDERA_KASAS: 1.99,
  SIDERA_FYLLOU: 2.34,
  ARMOKALYPTRO: 4.77,
} as const;

export interface PvcCostingInput {
  typology: PvcTypology;
  W: number;
  H: number;
  glassPriceEurPerM2: number; // δίνεται ελεύθερα ανά κοστολόγηση — καμία αποθηκευμένη τιμή τζαμιού PVC
}

export interface PvcCostingLine {
  material: string;
  meters?: number;
  areaM2?: number;
  unitPrice: number;
  cost: number;
}

export interface PvcCostingResult {
  typology: PvcTypology;
  lines: PvcCostingLine[];
  materialsCost: number;
  wholesalePrice: number; // ΧΟΝΔΡΙΚΗ
  retailPrice: number; // ΛΙΑΝΙΚΗ
  sourceRules: string[];
  warnings: string[];
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function requireCuttingRule(typology: PvcTypology): string {
  const ruleId =
    typology === "STATHERO"
      ? "PVC_STATHERO_CUT"
      : typology === "MONOFYLLO"
      ? "PVC_MONOFYLLO_CUT"
      : "PVC_DIFYLLO_CUT";
  const rule = getRule(ruleId);
  assertUsable(rule);
  return rule.RULE_ID;
}

export function cutPvc(input: PvcOpeningInput): PvcCuttingResult {
  const { W, H } = input;
  const cutRuleId = requireCuttingRule(input.typology);
  const glassRule = getRule("PVC_GLASS_RULE");
  assertUsable(glassRule);
  const sourceRules = [cutRuleId];
  const warnings: string[] = [];

  const frame: Rect = { width: W + 6, height: H + 6 };
  const frameSteel = { rect: { width: W - 120, height: H - 120 }, qty: 2 };

  if (input.typology === "STATHERO") {
    return {
      typology: "STATHERO",
      frame,
      frameSteel,
      glass: { width: W - 98, height: H - 98 },
      sourceRules,
      warnings,
    };
  }

  if (input.typology === "MONOFYLLO") {
    sourceRules.push(glassRule.RULE_ID);
    const leaf: Rect = { width: W - 66, height: H - 66 };
    const leafSteel = { rect: { width: W - 190, height: H - 190 }, qty: 2 };
    // ενεργός κανόνας: τζάμι = φύλλο − 136
    const glass: Rect = { width: leaf.width - 136, height: leaf.height - 136 };
    const beading: Rect = { width: glass.width + 10, height: glass.height + 10 };
    return {
      typology: "MONOFYLLO",
      frame,
      leaf,
      frameSteel,
      leafSteel,
      glass,
      beading,
      sourceRules,
      warnings,
    };
  }

  // ΔΙΦΥΛΛΟ
  sourceRules.push(glassRule.RULE_ID);
  const leafWidth = W / 2 - 34;
  const leafHeight = H - 66;
  const leaves: Rect[] = [
    { width: leafWidth, height: leafHeight },
    { width: leafWidth, height: leafHeight },
  ];
  const leafSteel = { rect: { width: W / 2 - 160, height: H - 190 }, qty: 4 };
  // τζάμι ανά φύλλο = W/2-170 x H-202 (§4 πηγή· ισοδυναμεί με φύλλο−136 στο πλάτος: (W/2-34)-136=W/2-170)
  const glassDirect: Rect = { width: W / 2 - 170, height: H - 202 };
  const glasses: Rect[] = [glassDirect, { ...glassDirect }];
  const beadingPerLeaf: Rect = { width: W / 2 - 160, height: H - 192 };
  warnings.push(
    "Το «κάθετο στοιχείο» H-153 χρεώνεται ως ΜΠΙΝΙ στην κοστολόγηση αλλά η γεωμετρική/παραγωγική του σημασία παραμένει PENDING (CRITICAL_CONFLICT_003) — μην το ερμηνεύσεις χωρίς επιβεβαίωση Φίλιππου."
  );

  return {
    typology: "DIFYLLO",
    frame,
    leaves,
    frameSteel,
    leafSteel,
    glasses,
    beading: [beadingPerLeaf, beadingPerLeaf],
    midElement: { length: H - 153, note: "χρεώνεται ως ΜΠΙΝΙ — ονομασία/σημασία PENDING" },
    sourceRules,
    warnings,
  };
}

export function costPvc(input: PvcCostingInput): PvcCostingResult {
  const { W, H, glassPriceEurPerM2 } = input;
  requireCuttingRule(input.typology);
  const glassRule = getRule("PVC_GLASS_RULE");
  assertUsable(glassRule);

  const P = PVC_MATERIAL_PRICES_EUR_PER_M;
  const sourceRules = [requireCuttingRule(input.typology), glassRule.RULE_ID];
  const warnings: string[] = [];
  const lines: PvcCostingLine[] = [];

  const frame: Rect = { width: W + 6, height: H + 6 };
  const frameMeters = ((frame.width * 2) + (frame.height * 2)) / 1000;
  const frameSteel: Rect = { width: W - 120, height: H - 120 };
  const frameSteelMeters = ((frameSteel.width * 2) + (frameSteel.height * 2)) / 1000;
  const armokalyptroMeters = frameMeters + 0.5;

  lines.push({ material: "ΚΑΣΑ", meters: frameMeters, unitPrice: P.KASA, cost: frameMeters * P.KASA });
  lines.push({
    material: "ΣΙΔΕΡΟ ΚΑΣΑΣ",
    meters: frameSteelMeters,
    unitPrice: P.SIDERA_KASAS,
    cost: frameSteelMeters * P.SIDERA_KASAS,
  });

  if (input.typology === "STATHERO") {
    const glass: Rect = { width: W - 98, height: H - 98 };
    const glassAreaM2 = (glass.width * glass.height) / 1_000_000;
    lines.push({
      material: "ΠΙΧΑΚΙ",
      meters: frameMeters,
      unitPrice: P.PIXAKI,
      cost: frameMeters * P.PIXAKI,
    });
    lines.push({
      material: "ΑΡΜΟΚΑΛΥΠΤΡΟ",
      meters: armokalyptroMeters,
      unitPrice: P.ARMOKALYPTRO,
      cost: armokalyptroMeters * P.ARMOKALYPTRO,
    });
    lines.push({
      material: "ΤΖΑΜΙ",
      areaM2: glassAreaM2,
      unitPrice: glassPriceEurPerM2,
      cost: glassAreaM2 * glassPriceEurPerM2,
    });
    const materialsCost = round4(lines.reduce((s, l) => s + l.cost, 0));
    const wholesalePrice = round4(materialsCost + 60 + 20);
    const retailPrice = round4(wholesalePrice + 80);
    return { typology: "STATHERO", lines, materialsCost, wholesalePrice, retailPrice, sourceRules, warnings };
  }

  if (input.typology === "MONOFYLLO") {
    const leaf: Rect = { width: W - 66, height: H - 66 };
    const leafMeters = ((leaf.width * 2) + (leaf.height * 2)) / 1000;
    // ΣΗΜΕΙΩΣΗ (CRITICAL_CONFLICT_002, πηγή αρχείο κοστολόγησης): σίδερο φύλλου
    // εδώ = φύλλο − 124 (πλάτος ΚΑΙ ύψος), που αριθμητικά ισοδυναμεί με W-190/H-190
    // (επαληθευμένο ενάντια στα raw κελιά — βλ. tests).
    const leafSteel: Rect = { width: leaf.width - 124, height: leaf.height - 124 };
    const leafSteelMeters = ((leafSteel.width * 2) + (leafSteel.height * 2)) / 1000;
    const glass: Rect = { width: leaf.width - 136, height: leaf.height - 136 };
    const glassAreaM2 = (glass.width * glass.height) / 1_000_000;

    lines.push({ material: "ΦΥΛΛΟ", meters: leafMeters, unitPrice: P.FYLLO, cost: leafMeters * P.FYLLO });
    lines.push({
      material: "ΣΙΔΕΡΟ ΦΥΛΛΟΥ",
      meters: leafSteelMeters,
      unitPrice: P.SIDERA_FYLLOU,
      cost: leafSteelMeters * P.SIDERA_FYLLOU,
    });
    lines.push({
      material: "ΠΙΧΑΚΙ",
      meters: leafMeters, // μονόφυλλο: πιχάκι στα μέτρα του φύλλου, όχι της κάσας
      unitPrice: P.PIXAKI,
      cost: leafMeters * P.PIXAKI,
    });
    lines.push({
      material: "ΑΡΜΟΚΑΛΥΠΤΡΟ",
      meters: armokalyptroMeters,
      unitPrice: P.ARMOKALYPTRO,
      cost: armokalyptroMeters * P.ARMOKALYPTRO,
    });
    lines.push({
      material: "ΤΖΑΜΙ",
      areaM2: glassAreaM2,
      unitPrice: glassPriceEurPerM2,
      cost: glassAreaM2 * glassPriceEurPerM2,
    });
    lines.push({ material: "ΕΞΑΡΤΗΜΑΤΑ", unitPrice: 50, cost: 50 });

    const materialsCost = round4(lines.reduce((s, l) => s + l.cost, 0));
    const wholesalePrice = round4(materialsCost + 60 + 20);
    const retailPrice = round4(wholesalePrice + 80);
    return { typology: "MONOFYLLO", lines, materialsCost, wholesalePrice, retailPrice, sourceRules, warnings };
  }

  // ΔΙΦΥΛΛΟ
  const leafWidth = W / 2 - 34;
  const leafHeight = H - 66;
  const leafMeters4 = ((leafWidth * 4) + (leafHeight * 4)) / 1000; // 2 φύλλα x περίμετρος
  // ΜΠΙΝΙ costing formula (raw: κάσα.ύψος(H+6) − 159 = H−153) — ταυτίζεται με το «κάθετο
  // στοιχείο» H-153 της κοπής (§4), όχι διαφορετικό μέγεθος.
  const midElementLength = H - 153;
  const midElementMeters = midElementLength / 1000;
  const leafSteel: Rect = { width: leafWidth - 126, height: leafHeight - 124 };
  const leafSteelMeters4 = ((leafSteel.width * 4) + (leafSteel.height * 4)) / 1000;
  const glassPerLeaf: Rect = { width: leafWidth - 136, height: leafHeight - 136 };
  const glassAreaM2x2 = (glassPerLeaf.width * glassPerLeaf.height * 2) / 1_000_000;

  lines.push({
    material: "ΦΥΛΛΟ",
    meters: leafMeters4,
    unitPrice: P.FYLLO,
    cost: leafMeters4 * P.FYLLO,
  });
  lines.push({
    material: "ΜΠΙΝΙ",
    meters: midElementMeters,
    unitPrice: P.MPINI,
    cost: midElementMeters * P.MPINI,
  });
  lines.push({
    material: "ΣΙΔΕΡΟ ΦΥΛΛΟΥ",
    meters: leafSteelMeters4,
    unitPrice: P.SIDERA_FYLLOU,
    cost: leafSteelMeters4 * P.SIDERA_FYLLOU,
  });
  lines.push({
    material: "ΠΙΧΑΚΙ",
    meters: leafMeters4,
    unitPrice: P.PIXAKI,
    cost: leafMeters4 * P.PIXAKI,
  });
  lines.push({
    material: "ΑΡΜΟΚΑΛΥΠΤΡΟ",
    meters: armokalyptroMeters,
    unitPrice: P.ARMOKALYPTRO,
    cost: armokalyptroMeters * P.ARMOKALYPTRO,
  });
  lines.push({
    material: "ΤΖΑΜΙ",
    areaM2: glassAreaM2x2,
    unitPrice: glassPriceEurPerM2,
    cost: glassAreaM2x2 * glassPriceEurPerM2,
  });
  lines.push({ material: "ΕΞΑΡΤΗΜΑΤΑ", unitPrice: 80, cost: 80 });

  warnings.push(
    "Η γραμμή ΜΠΙΝΙ (H-153) είναι το ίδιο «κάθετο στοιχείο» του διφύλλου (§4) — η ονομασία/γεωμετρική του σημασία στην παραγωγή παραμένει PENDING (CRITICAL_CONFLICT_003), μην την ερμηνεύσεις χωρίς επιβεβαίωση Φίλιππου."
  );

  const materialsCost = round4(lines.reduce((s, l) => s + l.cost, 0));
  const wholesalePrice = round4(materialsCost + 80 + 30);
  const retailPrice = round4(wholesalePrice + 140);
  return { typology: "DIFYLLO", lines, materialsCost, wholesalePrice, retailPrice, sourceRules, warnings };
}
