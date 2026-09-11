/**
 * MCP tool contract — πώς το ενσωματωμένο Claude θα μιλάει στο ΤΣΙΑΝΤΗΣ ERP.
 *
 * Σημαντικό: το Claude ΔΕΝ παίρνει ποτέ απευθείας πρόσβαση στη βάση. Κάθε
 * tool call περνάει από αυτό το layer, που:
 *   1. επιβεβαιώνει ποιος καλεί (authentication — session/API key του
 *      "Claude" actor, ξεχωριστό από κάθε ανθρώπινο χρήστη),
 *   2. ελέγχει δικαιώματα (authorization — π.χ. calculate_cost χρειάζεται
 *      pricing.view_purchase_prices· update_business_rule χρειάζεται
 *      business_rules.write, το οποίο ΔΕΝ πρέπει να δίνεται ελεύθερα χωρίς
 *      έγκριση Φίλιππου),
 *   3. κάνει validation του input,
 *   4. εκτελεί τη λειτουργία μέσω του ίδιου service layer που
 *      χρησιμοποιεί και το ανθρώπινο API (καμία "παρακαμπτήρια" λογική για
 *      το AI),
 *   5. γράφει AuditLog entry με actorType=AI, actor=CLAUDE,
 *   6. επιστρέφει αποτέλεσμα ή σαφές σφάλμα.
 *
 * Αυτό το αρχείο ορίζει το CONTRACT (ονόματα, input/output σχήματα,
 * required permission) και συνδέει ό,τι ήδη είναι πραγματικά υλοποιημένο
 * (cut engine, price engine) με πραγματική λογική. Οι υπόλοιπες (DB-backed)
 * είναι σαφώς σημειωμένες ΝΟΤ_IMPLEMENTED μέχρι να υπάρχει πραγματική βάση
 * δεδομένων σε παραγωγή — βλ. STATUS.md.
 */

import type { Permission } from "../lib/rbac/roles.ts";
import { cutMonofylloEuropa850, type OpeningInput } from "../lib/cutting/europa-850.ts";
import { cutPvc, costPvc, type PvcOpeningInput, type PvcCostingInput } from "../lib/cutting/pvc.ts";
import { calculateNetPurchasePrice, type RollerCatalogItem } from "../lib/pricing/price-engine.ts";

export interface McpToolDefinition {
  name: string;
  description: string;
  requiredPermission: Permission | null; // null = επιτρέπεται σε κάθε εξουσιοδοτημένο caller (π.χ. search)
  status: "IMPLEMENTED" | "NOT_IMPLEMENTED_PENDING_DB";
}

export const MCP_TOOLS: McpToolDefinition[] = [
  { name: "search_customer", description: "Αναζήτηση πελάτη με οποιοδήποτε στοιχείο", requiredPermission: "customers.read", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "get_customer", description: "Στοιχεία πελάτη", requiredPermission: "customers.read", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "create_customer", description: "Δημιουργία πελάτη", requiredPermission: "customers.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "update_customer", description: "Ενημέρωση πελάτη", requiredPermission: "customers.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "search_project", description: "Αναζήτηση έργου", requiredPermission: "projects.read", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "get_project", description: "Πλήρη στοιχεία έργου", requiredPermission: "projects.read", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "create_project", description: "Νέο έργο", requiredPermission: "projects.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "update_project", description: "Ενημέρωση έργου", requiredPermission: "projects.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "create_opening", description: "Νέο κούφωμα (Κ01, Κ02, ...)", requiredPermission: "measurements.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "update_opening", description: "Ενημέρωση κουφώματος", requiredPermission: "measurements.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "calculate_cuts", description: "Υπολογισμός κοπών (μόνο CONFIRMED κανόνες)", requiredPermission: "cutting.calculate", status: "IMPLEMENTED" },
  { name: "calculate_glass", description: "Υπολογισμός τζαμιού από φύλλο+πηχάκι", requiredPermission: "cutting.calculate", status: "IMPLEMENTED" },
  { name: "calculate_cost", description: "Εσωτερική κοστολόγηση κουφώματος", requiredPermission: "pricing.view_purchase_prices", status: "IMPLEMENTED" },
  { name: "calculate_roller", description: "Καθαρή τιμή ρολού μετά έκπτωση", requiredPermission: "pricing.view_purchase_prices", status: "IMPLEMENTED" },
  { name: "create_quote", description: "Δημιουργία προσφοράς", requiredPermission: "quotes.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "update_quote", description: "Ενημέρωση προσφοράς", requiredPermission: "quotes.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "create_order", description: "Δημιουργία παραγγελίας", requiredPermission: "orders.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "update_order", description: "Ενημέρωση παραγγελίας", requiredPermission: "orders.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "record_payment", description: "Καταχώρηση πληρωμής", requiredPermission: "payments.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "get_balance", description: "Υπόλοιπο πελάτη/έργου", requiredPermission: "payments.read", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "search_inventory", description: "Αναζήτηση αποθέματος", requiredPermission: "inventory.read", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "create_inventory_transaction", description: "Κίνηση αποθήκης", requiredPermission: "inventory.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "upload_project_document", description: "Ανέβασμα εγγράφου/φωτογραφίας έργου", requiredPermission: "documents.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "get_project_documents", description: "Λίστα εγγράφων έργου", requiredPermission: "documents.read", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "get_business_rule", description: "Ανάγνωση επίσημου κανόνα", requiredPermission: "business_rules.read", status: "IMPLEMENTED" },
  { name: "update_business_rule", description: "Αλλαγή επίσημου κανόνα — ΠΑΝΤΑ απαιτεί ρητή έγκριση Φίλιππου", requiredPermission: "business_rules.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "get_supplier_price", description: "Τρέχουσα τιμή προμηθευτή", requiredPermission: "pricing.view_purchase_prices", status: "NOT_IMPLEMENTED_PENDING_DB" },
  { name: "update_supplier_discount", description: "Αλλαγή μεταβλητής έκπτωσης (π.χ. 6%→8%)", requiredPermission: "pricing_variables.write", status: "NOT_IMPLEMENTED_PENDING_DB" },
];

/**
 * calculate_cuts — πραγματική υλοποίηση, ΗΔΗ λειτουργική.
 * Δρομολογεί σε EUROPA 850/8500 ή PVC ανάλογα με το system.
 */
export function toolCalculateCuts(
  input:
    | { kind: "EUROPA"; opening: OpeningInput }
    | { kind: "PVC"; opening: PvcOpeningInput }
) {
  if (input.kind === "EUROPA") return cutMonofylloEuropa850(input.opening);
  return cutPvc(input.opening);
}

/** calculate_cost — μόνο PVC έχει πλήρες costing engine υλοποιημένο σήμερα (αλουμίνιο εκκρεμεί, βλ. STATUS.md). */
export function toolCalculateCost(input: PvcCostingInput) {
  return costPvc(input);
}

/** calculate_roller — καθαρή τιμή ρολού μετά την τρέχουσα (ή ιστορική) έκπτωση. */
export function toolCalculateRoller(
  item: RollerCatalogItem,
  opts?: { asOfDate?: string; discountPercentOverride?: number }
) {
  return calculateNetPurchasePrice(item, opts ?? {});
}
