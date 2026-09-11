import type { Role, Permission, UserPermissionOverrides } from "../rbac/roles.ts";
import { can } from "../rbac/roles.ts";

/**
 * CallContext — ποιος καλεί το service layer αυτή τη στιγμή. Το ΙΔΙΟ
 * context type χρησιμοποιείται είτε ο caller είναι άνθρωπος (μέσω
 * session/API) είτε το ενσωματωμένο Claude (μέσω MCP) — actorType/actor
 * είναι το μόνο που διαφέρει, όλη η υπόλοιπη λογική (RBAC, audit) είναι
 * κοινή. Αυτό υλοποιεί ρητά το ζητούμενο "καμία πίσω πόρτα για το AI".
 */
export interface CallContext {
  actorType: "USER" | "AI" | "SYSTEM";
  actor: string; // user id, ή "CLAUDE"
  role: Role;
  permissionOverrides?: UserPermissionOverrides;
  source: string; // π.χ. "web-app", "mcp:record_payment"
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Δεν επιτρέπεται — χρειάζεται δικαίωμα "${permission}".`);
    this.name = "ForbiddenError";
  }
}

/** requirePermission() πετάει ForbiddenError αν ο caller δεν έχει το δικαίωμα — καλείται στην ΑΡΧΗ κάθε service function. */
export function requirePermission(ctx: CallContext, permission: Permission): void {
  if (!can(ctx.role, permission, ctx.permissionOverrides)) {
    throw new ForbiddenError(permission);
  }
}
