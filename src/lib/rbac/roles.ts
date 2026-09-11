/**
 * RBAC — ρόλοι και δικαιώματα.
 *
 * Οι 3 βασικοί ρόλοι είναι σταθεροί (OWNER_ADMIN / SECRETARY / TECHNICIAN),
 * αλλά ο πίνακας δικαιωμάτων είναι ΔΕΔΟΜΕΝΑ, όχι hardcoded if/else μέσα
 * στο UI — ο Admin πρέπει να μπορεί να το επεξεργαστεί (σε παραγωγή: γραμμές
 * στον πίνακα RolePermission, βλ. schema.prisma). Αυτό το αρχείο είναι το
 * default seed.
 */

export type Role = "OWNER_ADMIN" | "SECRETARY" | "TECHNICIAN";

export type Permission =
  | "customers.read"
  | "customers.write"
  | "projects.read"
  | "projects.write"
  | "measurements.write"
  | "cutting.calculate"
  | "pricing.view_purchase_prices" // εμπιστευτικές τιμές αγοράς/προμηθευτών
  | "pricing.view_margin" // κέρδος/περιθώριο
  | "quotes.read"
  | "quotes.write"
  | "orders.read"
  | "orders.write"
  | "payments.read"
  | "payments.write"
  | "installation.read"
  | "installation.write"
  | "service.read"
  | "service.write"
  | "inventory.read"
  | "inventory.write"
  | "documents.read"
  | "documents.write"
  | "business_rules.read"
  | "business_rules.write" // αλλαγή επίσημου κανόνα — μόνο Admin
  | "pricing_variables.write" // π.χ. αλλαγή έκπτωσης ρολών 6%→8%
  | "users.manage"
  | "audit_log.read";

const ALL_PERMISSIONS: Permission[] = [
  "customers.read",
  "customers.write",
  "projects.read",
  "projects.write",
  "measurements.write",
  "cutting.calculate",
  "pricing.view_purchase_prices",
  "pricing.view_margin",
  "quotes.read",
  "quotes.write",
  "orders.read",
  "orders.write",
  "payments.read",
  "payments.write",
  "installation.read",
  "installation.write",
  "service.read",
  "service.write",
  "inventory.read",
  "inventory.write",
  "documents.read",
  "documents.write",
  "business_rules.read",
  "business_rules.write",
  "pricing_variables.write",
  "users.manage",
  "audit_log.read",
];

/** Default permission matrix — επεξεργάσιμο από τον Admin σε παραγωγή (πίνακας DB, όχι αυτό το αρχείο). */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER_ADMIN: ALL_PERMISSIONS,
  SECRETARY: [
    "customers.read",
    "customers.write",
    "projects.read",
    "projects.write",
    "measurements.write",
    "cutting.calculate",
    "quotes.read",
    "quotes.write",
    "orders.read",
    "orders.write",
    "payments.read",
    "payments.write",
    "installation.read",
    "installation.write",
    "service.read",
    "service.write",
    "documents.read",
    "documents.write",
    // ΧΩΡΙΣ pricing.view_purchase_prices / pricing.view_margin από default —
    // ο Admin μπορεί να τα ενεργοποιήσει ρητά ανά χρήστη.
  ],
  TECHNICIAN: [
    "customers.read",
    "projects.read",
    "measurements.write",
    "installation.read",
    "installation.write",
    "service.read",
    "documents.read",
    "documents.write", // φωτογραφίες/σημειώσεις από το έργο
    // ΚΑΝΕΝΑ δικαίωμα σε τιμές αγοράς/κέρδος/εκπτώσεις εκτός αν δοθεί ρητά.
  ],
};

export interface UserPermissionOverrides {
  grant?: Permission[];
  revoke?: Permission[];
}

/** can() ελέγχει default matrix + per-user overrides (π.χ. τεχνικός με ρητή πρόσβαση σε τιμές). */
export function can(
  role: Role,
  permission: Permission,
  overrides?: UserPermissionOverrides
): boolean {
  if (overrides?.revoke?.includes(permission)) return false;
  if (overrides?.grant?.includes(permission)) return true;
  return DEFAULT_ROLE_PERMISSIONS[role].includes(permission);
}
