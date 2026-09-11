import type { ReactNode } from "react";

export const metadata = {
  title: "TSIANTIS ERP",
  description: "WINDOWS-MARKT internal management system",
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
        {children}
      </body>
    </html>
  );
}
