"use client";

import { useLocale, useTranslations } from "next-intl";
import { MapPin, Users, Clock, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Campaign } from "@/types/api";
import { formatAmount, daysLeft } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";
import { SmartImage } from "@/components/media/SmartImage";

export function CampaignCard({ c }: { c: Campaign }) {
  const t = useTranslations("campaigns");
  const locale = useLocale();
  const left = daysLeft(c.deadline);
  const blurMinor = false; // décidé côté serveur, le path est déjà neutralisé

  return (
    <Link
      href={`/campaigns/${c.slug}`}
      className="group card flex flex-col overflow-hidden transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
          <SmartImage path={c.cover_image_path} alt={c.title} blur={blurMinor} className="" />
        </div>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="chip bg-white/85 backdrop-blur">
            {t(`category.${c.category}`)}
          </span>
          <span className="chip bg-forest-600/90 text-sand-50">
            <ShieldCheck size={12} className="text-ochre-400" />
            {t(`type.${c.type}`)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin size={12} />
          {c.country}
          <span className="mx-1">·</span>
          <span className="line-clamp-1">{c.organization_name}</span>
        </div>

        <h3 className="mt-2 font-display text-lg leading-snug text-ink line-clamp-2">
          {c.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft line-clamp-2">
          {c.summary}
        </p>

        <div className="mt-auto pt-5">
          <ProgressBar value={c.progress_pct} />
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="font-display text-base font-semibold text-clay-600">
              {formatAmount(c.collected_amount, c.currency, locale)}
            </span>
            <span className="text-xs text-ink-muted">
              {Math.round(c.progress_pct)}% · {formatAmount(c.target_amount, c.currency, locale)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <Users size={12} /> {c.donor_count} {t("donors")}
            </span>
            {left !== null && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} /> {left} {t("daysLeft")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
