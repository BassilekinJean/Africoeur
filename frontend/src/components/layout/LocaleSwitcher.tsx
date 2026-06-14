"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="inline-flex items-center rounded-full border border-ink/12 bg-white/60 p-0.5 backdrop-blur">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          disabled={isPending}
          onClick={() =>
            startTransition(() => router.replace(pathname, { locale: l.code }))
          }
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-200 ease-out",
            locale === l.code
              ? "bg-ink text-sand-50"
              : "text-ink-soft hover:text-ink",
          )}
          aria-pressed={locale === l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
