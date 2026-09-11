import { test } from "node:test";
import assert from "node:assert/strict";
import { InMemoryRepository } from "../src/lib/repository/in-memory.ts";
import { recordPayment, getBalance } from "../src/lib/services/payments.ts";
import { ForbiddenError } from "../src/lib/services/context.ts";

function setup() {
  const repo = new InMemoryRepository();
  repo.seedProject({ id: "proj1", code: "2026-0001", customerId: "cust1", agreedAmount: 5000, version: 1 });
  return repo;
}

test("Καταχώρηση πληρωμής + υπόλοιπο", async () => {
  const repo = setup();
  const ctx = { actorType: "USER" as const, actor: "user1", role: "SECRETARY" as const, source: "web-app" };

  await recordPayment(repo, ctx, { projectId: "proj1", amount: 2000, paidAt: "2026-09-10" });
  const balance = await getBalance(repo, ctx, "proj1");

  assert.equal(balance.totalPaid, 2000);
  assert.equal(balance.balance, 3000);
  assert.equal(repo.auditLog.length, 1);
  assert.equal(repo.auditLog[0]?.action, "payment.create");
  assert.equal(repo.auditLog[0]?.actor, "user1");
});

test("TECHNICIAN δεν μπορεί να καταχωρήσει πληρωμή", async () => {
  const repo = setup();
  const ctx = { actorType: "USER" as const, actor: "tech1", role: "TECHNICIAN" as const, source: "mobile-app" };

  await assert.rejects(
    () => recordPayment(repo, ctx, { projectId: "proj1", amount: 100, paidAt: "2026-09-10" }),
    ForbiddenError
  );
});

test("Claude μέσω MCP καταχωρεί πληρωμή — audit log δείχνει actorType=AI", async () => {
  const repo = setup();
  const ctx = { actorType: "AI" as const, actor: "CLAUDE", role: "SECRETARY" as const, source: "mcp:record_payment" };

  await recordPayment(repo, ctx, { projectId: "proj1", amount: 500, paidAt: "2026-09-11" });

  assert.equal(repo.auditLog[0]?.actorType, "AI");
  assert.equal(repo.auditLog[0]?.actor, "CLAUDE");
  assert.equal(repo.auditLog[0]?.source, "mcp:record_payment");
});

test("Αρνητικό ποσό πληρωμής απορρίπτεται", async () => {
  const repo = setup();
  const ctx = { actorType: "USER" as const, actor: "user1", role: "OWNER_ADMIN" as const, source: "web-app" };
  await assert.rejects(() => recordPayment(repo, ctx, { projectId: "proj1", amount: -10, paidAt: "2026-09-10" }));
});
