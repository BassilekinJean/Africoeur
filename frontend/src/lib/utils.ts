export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatAmount(
  value: string | number,
  currency = "XAF",
  locale = "fr",
): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  const formatted = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
  return `${formatted} ${currency}`;
}

export function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const PUBLIC_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_BUCKET ?? "public-media";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Construit l'URL publique d'un média (Supabase Storage) ou renvoie l'URL telle quelle. */
export function mediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (!SUPABASE_URL) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${path}`;
}
