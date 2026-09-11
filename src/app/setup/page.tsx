import { prisma } from "@/lib/db";
import { createFirstAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    return (
      <main style={{ maxWidth: 360, margin: "0 auto", padding: "60px 20px" }}>
        <p style={{ fontSize: 13.5 }}>
          Η αρχική ρύθμιση έχει ήδη ολοκληρωθεί. <a href="/login">Σύνδεση →</a>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 360, margin: "0 auto", padding: "60px 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Αρχική ρύθμιση</h1>
      <p style={{ color: "#57606a", marginTop: 0, marginBottom: 24, fontSize: 13.5 }}>
        Δημιούργησε τον πρώτο λογαριασμό (Διαχειριστής).
      </p>

      {params?.error && (
        <p
          style={{
            background: "#ffebe9",
            border: "1px solid #ff8182",
            color: "#82071e",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 13.5,
          }}
        >
          Χρειάζεται όνομα, email, και κωδικός τουλάχιστον 8 χαρακτήρων.
        </p>
      )}

      <form
        action={createFirstAdmin}
        style={{
          background: "#fff",
          border: "1px solid #d0d7de",
          borderRadius: 8,
          padding: 16,
          display: "grid",
          gap: 10,
        }}
      >
        <input name="name" placeholder="Όνομα" required style={inputStyle} />
        <input name="email" type="email" placeholder="Email" required style={inputStyle} />
        <input
          name="password"
          type="password"
          placeholder="Κωδικός (τουλάχιστον 8 χαρακτήρες)"
          required
          minLength={8}
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Δημιουργία λογαριασμού
        </button>
      </form>
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
};
