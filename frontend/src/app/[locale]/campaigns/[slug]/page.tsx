import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Users,
  Clock,
  MapPin,
  Info,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { getCampaign, getDonors } from "@/lib/api";
import { formatAmount, daysLeft } from "@/lib/utils";
import { ProgressBar } from "@/components/campaigns/ProgressBar";
import { DonateWidget } from "@/components/campaigns/DonateWidget";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { SmartImage } from "@/components/media/SmartImage";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  const t = await getTranslations("detail");
  const tc = await getTranslations("campaigns");
  const donors = await getDonors(campaign.id);
  const left = daysLeft(campaign.deadline);
  const patient = campaign.patient;
  const commissionRate = campaign.type === "medical" ? "2,5 %" : "1,5 %";
  const blurMinor = Boolean(patient?.is_minor && patient?.display_level === 2);

  return (
    <article className="container-page py-10">
      <Link href="/campaigns" className="btn-ghost mb-6 !px-0">
        <ArrowLeft size={16} /> {t("back")}
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Colonne principale -------------------------------------------- */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">
              <ShieldCheck size={12} className="text-forest-500" />
              {tc(`type.${campaign.type}`)}
            </span>
            <span className="chip">{tc(`category.${campaign.category}`)}</span>
            <span className="chip">
              <MapPin size={12} /> {campaign.country}
            </span>
          </div>

          <h1 className="mt-4 font-display text-4xl leading-tight text-ink text-balance sm:text-5xl">
            {campaign.title}
          </h1>

          <div className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft">
            <ShieldCheck size={15} className="text-forest-500" />
            {t("verifiedBy")} <strong className="font-semibold">{campaign.organization_name}</strong>
          </div>

          <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-3xl border border-ink/10 shadow-soft">
            <SmartImage
              path={campaign.cover_image_path}
              alt={campaign.title}
              blur={blurMinor}
              priority
            />
          </div>

          {blurMinor && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ochre-400/15 px-3 py-2 text-xs text-ink-soft">
              <Info size={14} className="text-ochre-600" /> {t("minorNotice")}
            </p>
          )}

          {/* Profil patient (cas médical) */}
          {patient && (
            <div className="card mt-6 flex flex-wrap items-center gap-6 p-5">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  {t("patientSituation")}
                </span>
                <p className="mt-1 font-display text-lg text-ink">
                  {patient.display_name} · {patient.age} ans
                </p>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-ink-soft">
                {patient.general_situation}
              </p>
            </div>
          )}

          <section className="mt-10">
            <h2 className="font-display text-2xl text-ink">{t("presentation")}</h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {campaign.description}
            </p>
          </section>

          {campaign.video_path && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-2xl text-ink">{t("video")}</h2>
              <VideoPlayer path={campaign.video_path} poster={campaign.cover_image_path} />
            </section>
          )}

          {campaign.field_updates.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl text-ink">{t("updates")}</h2>
              <div className="mt-4 space-y-4">
                {campaign.field_updates.map((u) => (
                  <div key={u.id} className="card p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg text-ink">{u.title}</h3>
                      <time className="text-xs text-ink-muted">
                        {new Date(u.created_at).toLocaleDateString(locale)}
                      </time>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{u.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {campaign.fund_usage_reports.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl text-ink">{t("fundUsage")}</h2>
              <div className="mt-4 space-y-3">
                {campaign.fund_usage_reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/70 p-4">
                    <div>
                      <p className="font-medium text-ink">{r.title}</p>
                      <p className="text-sm text-ink-soft">{r.description}</p>
                    </div>
                    <span className="font-display font-semibold text-forest-500">
                      {formatAmount(r.amount_used, campaign.currency, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Donateurs */}
          <section className="mt-10">
            <h2 className="font-display text-2xl text-ink">{t("donors")}</h2>
            {donors.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">{t("noDonors")}</p>
            ) : (
              <ul className="mt-4 divide-y divide-ink/8">
                {donors.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-50 font-display text-sm font-semibold text-clay-600">
                        {d.donor_name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{d.donor_name}</p>
                        {d.message && <p className="text-xs text-ink-soft">{d.message}</p>}
                      </div>
                    </div>
                    <span className="font-display text-sm font-semibold text-clay-600">
                      {formatAmount(d.amount, d.currency, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Colonne latérale : progression + don --------------------------- */}
        <aside className="space-y-5">
          <div className="card p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-semibold text-clay-600">
                {formatAmount(campaign.collected_amount, campaign.currency, locale)}
              </span>
              <span className="text-sm text-ink-muted">
                {Math.round(campaign.progress_pct)}%
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {tc("goal")} : {formatAmount(campaign.target_amount, campaign.currency, locale)}
            </p>
            <ProgressBar value={campaign.progress_pct} className="mt-4" />
            <div className="mt-4 flex items-center gap-5 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <Users size={15} /> {campaign.donor_count} {tc("donors")}
              </span>
              {left !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} /> {left} {tc("daysLeft")}
                </span>
              )}
            </div>
          </div>

          <DonateWidget
            slug={campaign.slug}
            currency={campaign.currency}
            commissionRate={commissionRate}
          />
        </aside>
      </div>
    </article>
  );
}
