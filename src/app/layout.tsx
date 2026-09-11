import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logoutAction } from "@/lib/auth/actions";

const ROLE_LABELS: Record<string, string> = {
  OWNER_ADMIN: "Διαχειριστής",
  SECRETARY: "Γραμματεία",
  TECHNICIAN: "Τεχνικός",
};

export const metadata = {
  title: "ΤΣΙΑΝΤΗΣ ERP",
  description: "WINDOWS-MARKT — εσωτερικό σύστημα διαχείρισης",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="el">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#f4f5f7",
          color: "#1a1a1a",
        }}
      >
        {user && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 10,
              padding: "8px 20px",
              background: "#fff",
              borderBottom: "1px solid #d0d7de",
              fontSize: 12.5,
              color: "#57606a",
            }}
          >
            <span>
              {user.name} · {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                style={{
                  background: "none",
                  border: "none",
                  color: "#0969da",
                  cursor: "pointer",
                  fontSize: 12.5,
                  padding: 0,
                }}
              >
                Αποσύνδεση
              </button>
            </form>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
