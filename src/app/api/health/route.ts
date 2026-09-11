import { NextResponse } from "next/server";
import { BUSINESS_RULES } from "@/lib/rules/registry";

export async function GET() {
  const byStatus: Record<string, number> = {};
  for (const rule of BUSINESS_RULES) {
    byStatus[rule.STATUS] = (byStatus[rule.STATUS] ?? 0) + 1;
  }

  return NextResponse.json({
    status: "ok",
    service: "tsiantis-erp",
    businessRulesLoaded: BUSINESS_RULES.length,
    businessRulesByStatus: byStatus,
    time: new Date().toISOString(),
  });
}
