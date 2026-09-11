import { prisma } from "@/lib/db";
import { createCustomer } from "./actions";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <a href="/" style={{ fontSize: 13, color: "#57606a" }}>
        ← Πίσω
      </a>
      <h1 style={{ fontSize: 24, margin: "10px 0 4px" }}>Πελάτες</h1>
      <p style={{ color: "#57606a", marginTop: 0, marginBottom: 24, fontSize: 13.5 }}>
        Πρώτη πραγματική οθόνη με μόνιμη αποθήκευση — ό,τι προσθέσεις εδώ
        μένει αποθηκευμένο στη βάση δεδομένων.
      </p>

      <form
        action={createCustomer}
        style={{
          background: "#fff",
          border: "1px solid #d0d7de",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input name="firstName" placeholder="Όνομα" required style={inputStyle} />
          <input name="lastName" placeholder="Επώνυμο" required style={inputStyle} />
        </div>
        <input name="phone" placeholder="Τηλέφωνο" style={inputStyle} />
        <input name="location" placeholder="Τοποθεσία" style={inputStyle} />
        <button type="submit" style={buttonStyle}>
          Προσθήκη πελάτη
        </button>
      </form>

      <div style={{ display: "grid", gap: 8 }}>
        {customers.length === 0 && (
          <p style={{ color: "#8b949e", fontSize: 13.5 }}>
            Δεν υπάρχει ακόμα κανένας πελάτης.
          </p>
        )}
        {customers.map((c) => (
          <div
            key={c.id}
            style={{
              background: "#fff",
              border: "1px solid #d0d7de",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            <strong>
              {c.firstName} {c.lastName}
            </strong>
            <div style={{ fontSize: 13, color: "#57606a" }}>
              {[c.phone, c.location].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d0d7de",
  borderRadius: 6,
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  padding: "9px 14px",
  background: "#1a7f37",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  justifySelf: "start",
};
