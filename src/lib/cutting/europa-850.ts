/**
 * Cut Engine — EUROPA 850 / 8500 (αλουμίνιο).
 *
 * Κάθε συνάρτηση εδώ υλοποιεί ΑΠΟΚΛΕΙΣΤΙΚΑ κανόνες με STATUS
 * VERIFIED/USER_VERIFIED στο rules/registry.ts. Ζητούμενο του Φίλιππου:
 * "ποτέ μην επινοείς κανόνες κοπής" — αυτό εφαρμόζεται εδώ ΣΕ ΚΩΔΙΚΑ, όχι
 * μόνο σε κείμενο: assertUsable() πετάει UnverifiedRuleError αν λείπει η
 * επιβεβαίωση, οπότε το calculation απλά δεν τρέχει.
 *
 * Πηγή αριθμών: knowledge/01_CUTTING_RULES.md, 03_GLASS_RULES.md,
 * 09_CONFIRMED_EXAMPLES.md (χρησιμοποιούνται αυτούσια ως regression tests
 * — βλ. tests/cutting.europa850.test.ts).
 */

import { assertUsable } from "../rules/types.ts";
import { getRule } from "../rules/registry.ts";

export type HeightMode = "SYN_KOUTI" | "OLIKO";
export type BoxHeight = 145 | 185 | 220;
export type AluminiumSeries = "EUROPA_850" | "EUROPA_8500";

export interface OpeningInput {
  series: AluminiumSeries;
  openingWidth: number; // mm
  openingHeight: number; // mm
  roller?: {
    heightMode: HeightMode;
    boxHeight: BoxHeight;
  };
}

export interface Rect {
  width: number;
  height: number;
}

export interface CuttingResult {
  frame: Rect; // κάσα
  leaf: Rect; // φύλλο
  glass: Rect; // τζάμι
  glassComposition: string;
  glassMaxThicknessMm: number;
  kareRolou?: {
    profile: "40x20" | "80x20" | "100x20";
    guides: { length: number; qty: 2 }; // οδηγοί
    bottom: { length: number; qty: 1 }; // κάτω
  };
  sourceRules: string[]; // RULE_IDs που χρησιμοποιήθηκαν, για audit trail
  warnings: string[];
}

/** Κόβει προς τα κάτω σε 1 δεκαδικό (αποκοπή, όχι στρογγυλοποίηση) — όπως δουλεύουν τα μηχανήματα. */
function truncate1(n: number): number {
  return Math.trunc(n * 10) / 10;
}

const SUPPORTED_SERIES: Record<AluminiumSeries, { cutRuleId: string; glassRuleId: string; kareRuleId: string; rollerRuleId: string }> = {
  EUROPA_850: {
    cutRuleId: "EUROPA_850_MONOFYLLO_CUT",
    glassRuleId: "GLASS_850_871_8500",
    kareRuleId: "KARE_ROLLOU_CUT",
    rollerRuleId: "EUROPA_850_8500_ROLLER_CUT",
  },
  EUROPA_8500: {
    cutRuleId: "EUROPA_8500_MONOFYLLO_CUT",
    glassRuleId: "GLASS_8500_8550_8500",
    kareRuleId: "KARE_ROLLOU_CUT",
    rollerRuleId: "EUROPA_850_8500_ROLLER_CUT",
  },
};

const GLASS_META: Record<string, { maxThicknessMm: number; composition: string }> = {
  GLASS_850_871_8500: { maxThicknessMm: 18, composition: "4-10-4" },
  GLASS_8500_8550_8500: { maxThicknessMm: 24, composition: "4-16-4" },
};

/**
 * Μονόφυλλο EUROPA 850/8500 — με ή χωρίς ρολό επικαθήμενο.
 * Αλυσίδα: κάσα → φύλλο (−47) → τζάμι (−118). Με ρολό: πλάτος κάσας +3,
 * ύψος κάσας ανάλογα με ΣΥΝ ΚΟΥΤΙ / ΟΛΙΚΟ.
 */
export function cutMonofylloEuropa850(input: OpeningInput): CuttingResult {
  const cfg = SUPPORTED_SERIES[input.series];
  if (!cfg) {
    throw new Error(
      `Η σειρά "${input.series}" δεν υποστηρίζεται από αυτό το engine. Βλ. status-index.md.`
    );
  }

  const cutRule = getRule(cfg.cutRuleId);
  assertUsable(cutRule);
  const glassRule = getRule(cfg.glassRuleId);
  assertUsable(glassRule);

  const sourceRules = [cutRule.RULE_ID, glassRule.RULE_ID];
  const warnings: string[] = [];

  let frameWidth = input.openingWidth;
  let frameHeight = input.openingHeight;

  if (input.roller) {
    const rollerRule = getRule(cfg.rollerRuleId);
    assertUsable(rollerRule);
    sourceRules.push(rollerRule.RULE_ID);

    // ΔΙΚΛΕΙΔΑ 1 — ΠΛΑΤΟΣ: πάντα άνοιγμα + 3
    frameWidth = input.openingWidth + 3;

    // ΔΙΚΛΕΙΔΑ 2 — ΥΨΟΣ
    if (input.roller.heightMode === "SYN_KOUTI") {
      frameHeight = input.openingHeight; // δίνεται ήδη χωρίς το κουτί
    } else {
      frameHeight = input.openingHeight - input.roller.boxHeight; // ΟΛΙΚΟ: αφαιρούμε το κουτί
    }
  }

  const frame: Rect = { width: truncate1(frameWidth), height: truncate1(frameHeight) };
  const leaf: Rect = { width: truncate1(frame.width - 47), height: truncate1(frame.height - 47) };
  const glass: Rect = { width: truncate1(leaf.width - 118), height: truncate1(leaf.height - 118) };

  const glassMeta = GLASS_META[glassRule.RULE_ID];

  const result: CuttingResult = {
    frame,
    leaf,
    glass,
    glassComposition: glassMeta.composition,
    glassMaxThicknessMm: glassMeta.maxThicknessMm,
    sourceRules,
    warnings,
  };

  if (input.roller) {
    const kareRule = getRule(cfg.kareRuleId);
    assertUsable(kareRule);
    sourceRules.push(kareRule.RULE_ID);

    const profile: "40x20" | "80x20" | "100x20" =
      input.roller.heightMode === "SYN_KOUTI" ? "40x20" : "80x20";
    if (input.roller.heightMode === "OLIKO") {
      warnings.push(
        "ΟΛΙΚΟ ρολό: καρέ 80x20 ή 100x20 (επιλογή πελάτη) — υποθέτηκε 80x20, επιβεβαίωσε με τον πελάτη."
      );
    }

    result.kareRolou = {
      profile,
      guides: { length: truncate1(frame.height - 3), qty: 2 },
      bottom: { length: truncate1(frame.width - 46), qty: 1 },
    };

    // TV211/TV212: μόνο όταν έχει ρολό ΚΑΙ η μέτρηση είναι ΣΥΝ ΚΟΥΤΙ
    if (input.roller.heightMode === "SYN_KOUTI") {
      warnings.push(
        "Χρειάζεται επιπλέον 1x TV211 + 1x TV212, κομμένα στο πλάτος της κάσας (" +
          frame.width +
          "mm) — υποχρεωτικό όταν η μέτρηση είναι ΣΥΝ ΚΟΥΤΙ."
      );
    }
  }

  return result;
}
