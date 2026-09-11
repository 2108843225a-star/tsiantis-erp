/**
 * Payments service — πλήρες παράδειγμα του pattern που θα ακολουθεί ΚΑΘΕ
 * write ενέργεια στο ERP (είτε από χρήστη είτε από Claude μέσω MCP):
 * authorization → validation → business logic → repository write
 * (optimistic locking) → audit log, όλα μέσα σε ένα σημείο.
 */

import type { Repository } from "../repository/types.ts";
import { requirePermission, type CallContext } from "./context.ts";
import { buildAuditEntry } from "../audit/audit-log.ts";

export interface RecordPaymentInput {
  projectId: string;
  amount: number;
  paidAt: string; // ISO date
}

export async function recordPayment(
  repo: Repository,
  ctx: CallContext,
  input: RecordPaymentInput
) {
  requirePermission(ctx, "payments.write");

  if (input.amount <= 0) {
    throw new Error("Το ποσό πληρωμής πρέπει να είναι θετικό.");
  }

  const project = await repo.getProject(input.projectId);
  if (!project) throw new Error(`Άγνωστο έργο: ${input.projectId}`);

  const payment = await repo.createPayment({
    projectId: input.projectId,
    amount: input.amount,
    paidAt: input.paidAt,
    recordedById: ctx.actor,
  });

  await repo.appendAudit(
    buildAuditEntry({
      actorType: ctx.actorType,
      actor: ctx.actor,
      action: "payment.create",
      before: null,
      after: payment,
      source: ctx.source,
      relatedProjectId: input.projectId,
    })
  );

  return payment;
}

export interface BalanceResult {
  projectId: string;
  agreedAmount: number;
  totalPaid: number;
  balance: number;
}

export async function getBalance(
  repo: Repository,
  ctx: CallContext,
  projectId: string
): Promise<BalanceResult> {
  requirePermission(ctx, "payments.read");

  const project = await repo.getProject(projectId);
  if (!project) throw new Error(`Άγνωστο έργο: ${projectId}`);
  if (project.agreedAmount == null) {
    throw new Error("Το έργο δεν έχει ακόμα συμφωνηθέν ποσό — δεν μπορεί να υπολογιστεί υπόλοιπο.");
  }

  const payments = await repo.listPayments(projectId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    projectId,
    agreedAmount: project.agreedAmount,
    totalPaid,
    balance: round2(project.agreedAmount - totalPaid),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
