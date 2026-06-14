"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const TYPES = ["medical", "ngo_project"] as const;
const CATEGORIES = ["health", "emergency", "education", "development", "social"] as const;
const COUNTRIES = ["CM", "CI", "SN", "TG", "BF"] as const;

export function Filters({
  current,
}: {
  current: { type?: string; category?: string; country?: string; search?: string };
}) {
  const t = useTranslations("campaigns");
  const router = useRouter();
  const pathname = usePathname();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams();
      Object.entries(current).forEach(([k, v]) => v && params.set(k, v));
      if (value === null || params.get(key) === value) params.delete(key);
      else params.set(key, value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [current, pathname, router],
  );

  const Pill = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-[transform,background-color,border-color] duration-200 ease-out active:scale-[0.96]",
        active
          ? "border-clay-500 bg-clay-500 text-sand-50"
          : "border-ink/12 bg-white/70 text-ink-soft hover:border-ink/25",
      )}
    >
      {children}
    </button>
  );

  const hasFilters = current.type || current.category || current.country || current.search;

  return (
    <div className="card p-5">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          defaultValue={current.search ?? ""}
          placeholder={t("filters.search")}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => setParam("search", v || null), 350);
          }}
          className="field pl-11"
        />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            {t("filters.type")}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((v) => (
              <Pill key={v} active={current.type === v} onClick={() => setParam("type", v)}>
                {t(`type.${v}`)}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            {t("filters.category")}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((v) => (
              <Pill key={v} active={current.category === v} onClick={() => setParam("category", v)}>
                {t(`category.${v}`)}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            {t("filters.country")}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {COUNTRIES.map((v) => (
              <Pill key={v} active={current.country === v} onClick={() => setParam("country", v)}>
                {v}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => router.replace(pathname, { scroll: false })}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:text-clay-700"
        >
          <X size={13} /> {t("filters.reset")}
        </button>
      )}
    </div>
  );
}
