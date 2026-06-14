import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="font-display text-7xl text-clay-500">404</span>
      <p className="mt-3 text-ink-soft">Cette page est introuvable.</p>
      <Link href="/" className="btn-primary mt-6">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
