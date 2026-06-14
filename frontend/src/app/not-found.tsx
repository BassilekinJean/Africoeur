import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui", textAlign: "center", padding: "6rem 1rem" }}>
        <h1 style={{ fontSize: "3rem", margin: 0 }}>404</h1>
        <p>Page introuvable / Page not found.</p>
        <Link href="/fr">Africœur →</Link>
      </body>
    </html>
  );
}
