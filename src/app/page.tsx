import { BUSINESS_RULES } from "@/lib/rules/registry";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/rbac/roles";

const STATUS_COLORS: Record<string, string> = {
  VERIFIED: "#1a7f37",
  USER_VERIFIED: "#1a7f37",
  PENDING: "#9a6700",
  SUPERSEDED: "#6e7781",
};

export default function HomePage() {
  const counts: Record<string, number> = {};
  for (const rule of BUSINESS_RULES) {
    counts[rule.STATUS] = (counts[rule.STATUS] ?? 0) + 1;
  }
  const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS);
  const activeRules = BUSINESS_RULES.filter(
    (r) => r.STATUS === "VERIFIED" || r.STATUS === "USER_VERIFIED"
  );

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>ΤΣΙΑΝΤΗΣ ERP</h1>
        <p style={{ color: "#57606a", marginTop: 4 }}>
          WINDOWS-MARKT — το σύστημα είναι live. Οι υπόλοιπες οθόνες
          διαχείρισης (έργα, προσφορές) έρχονται στο επόμενο στάδιο.
        </p>
      </header>

      <section style={{ marginBottom: 28 }}>
        <a
          href="/customers"
          style={{
            display: "inline-block",
            background: "#1a7f37",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Άνοιγμα: Πελάτες →
        </a>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {Object.entries(counts).map(([status, count]) => (
          <div
            key={status}
            style={{
              background: "#fff",
              border: "1px solid #d0d7de",
              borderRadius: 8,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700 }}>{count}</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: STATUS_COLORS[status] ?? "#57606a",
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              {status}
            </div>
          </div>
        ))}
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #d0d7de",
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>
          Ενεργοί κανόνες κοπής/τζαμιού ({activeRules.length})
        </h2>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7 }}>
          {activeRules.map((r) => (
            <li key={r.RULE_ID}>
              <strong>{r.RULE_ID}</strong> — {r.SYSTEM} / {r.TYPOLOGY}
            </li>
          ))}
        </ul>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #d0d7de",
          borderRadius: 8,
          padding: "16px 20px",
        }}
      >
        <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Ρόλοι χρηστών</h2>
        <p style={{ fontSize: 13.5, color: "#57606a", margin: 0 }}>
          {roles.join(" · ")}
        </p>
      </section>

      <footer style={{ marginTop: 28, fontSize: 12, color: "#8b949e" }}>
        API health check: <code>/api/health</code>
      </footer>
    </main>
  );
}
