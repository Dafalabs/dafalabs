import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="tr">
      <body
        style={{
          background: "#08090a",
          color: "#f4f5f6",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              color: "#7d838a",
              margin: 0,
            }}
          >
            404
          </p>
          <h1 style={{ fontSize: "2rem", margin: "1rem 0 0.75rem" }}>
            Sayfa bulunamadı
          </h1>
          <p style={{ color: "#7d838a", margin: "0 0 2rem" }}>
            Page not found
          </p>
          <Link
            href="/tr"
            style={{
              background: "#e0a33c",
              color: "#08090a",
              padding: "0.9rem 1.75rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            dafalabs.com
          </Link>
        </div>
      </body>
    </html>
  );
}
