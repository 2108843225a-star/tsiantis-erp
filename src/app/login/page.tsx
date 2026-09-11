import { loginAction } from "@/lib/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main
      style={{
        maxWidth: 360,
        margin: "0 auto",
        padding: "60px 20px",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>ΤΣΙΑΝΤΗΣ ERP</h1>
      <p style={{ color: "#57606a", marginTop: 0, marginBottom: 24, fontSize: 13.5 }}>
        WINDOWS-MARKT — σύνδεση
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
          Λάθος email ή κωδικός.
        </p>
      )}

      <form
        action={loginAction}
        style={{
          background: "#fff",
          border: "1px solid #d0d7de",
          borderRadius: 8,
          padding: 16,
          display: "grid",
          gap: 10,
        }}
      >
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          autoFocus
          style={inputStyle}
        />
        <input
          name="password"
          type="password"
          placeholder="Κωδικός"
          required
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Σύνδεση
        </button>
      </form>

      <p style={{ fontSize: 12, color: "#8b949e", marginTop: 16 }}>
        Πρώτη φορά; <a href="/setup">Αρχική ρύθμιση</a>
      </p>
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
