import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  ShieldCheck,
  HandCoins,
  Landmark,
  FileCheck2,
  UserCheck,
  Lock,
  EyeOff,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { Stat } from "@/components/home/Stat";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hero");
  const tt = await getTranslations("trust");
  const th = await getTranslations("how");
  const tc = await getTranslations("campaigns");
  const campaigns = (await getCampaigns({ status: "active" })).slice(0, 3);

  const trustItems = [
    { key: "validation", Icon: UserCheck },
    { key: "noFamily", Icon: EyeOff },
    { key: "escrow", Icon: Lock },
    { key: "privacy", Icon: ShieldCheck },
  ] as const;

  const steps = [
    { key: "s1", Icon: UserCheck },
    { key: "s2", Icon: HandCoins },
    { key: "s3", Icon: Landmark },
    { key: "s4", Icon: FileCheck2 },
  ] as const;

  return (
    <>
      {/* HERO ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-12 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow">
              <span className="h-px w-6 bg-clay-500" />
              {t("eyebrow")}
            </span>
            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.05] text-ink text-balance sm:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/campaigns" className="btn-primary">
                {t("ctaPrimary")}
                <ArrowRight size={16} />
              </Link>
              <Link href="/#trust" className="btn-secondary">
                {t("ctaSecondary")}
              </Link>
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-ink/10 pt-7">
              <Stat value="100%" label={t("stat1")} />
              <Stat value="100%" label={t("stat2")} />
              <Stat value="0%" label={t("stat3")} />
            </div>
          </div>

          {/* Visuel : carte d'appel flottante sur halo terre/soleil */}
          <div className="relative animate-scale-in">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-ochre-400/30 via-clay-400/20 to-forest-400/20 blur-2xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-ink/10 shadow-lift">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=70"
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-white/40 bg-sand-50/85 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-forest-600">
                  <ShieldCheck size={14} /> {tc("by")} Hôpital Central de Yaoundé
                </div>
                <p className="mt-1.5 font-display text-base text-ink">
                  Opération du cœur pour Awa, 7 ans
                </p>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-ochre-500 to-clay-600" />
                </div>
                <div className="mt-2 flex justify-between text-xs text-ink-soft">
                  <span className="font-semibold text-clay-600">2 870 000 XAF</span>
                  <span>64%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST --------------------------------------------------------------- */}
      <section id="trust" className="scroll-mt-20 bg-white/50 py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <span className="eyebrow">{tt("eyebrow")}</span>
            <h2 className="mt-3 font-display text-4xl text-ink text-balance">
              {tt("title")}
            </h2>
            <p className="mt-4 text-lg text-ink-soft">{tt("subtitle")}</p>
          </div>

          <div className="stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(({ key, Icon }) => (
              <div key={key} className="card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-lg text-ink">
                  {tt(`items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {tt(`items.${key}.text`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CAMPAIGNS -------------------------------------------------- */}
      <section className="py-20">
        <div className="container-page">
          <div className="flex items-end justify-between gap-6">
            <div>
              <span className="eyebrow">{tc("title")}</span>
              <h2 className="mt-3 font-display text-4xl text-ink">{tc("subtitle")}</h2>
            </div>
            <Link href="/campaigns" className="btn-ghost hidden shrink-0 sm:inline-flex">
              {tc("filters.all")} <ArrowRight size={15} />
            </Link>
          </div>

          <div className="stagger mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} c={c} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS -------------------------------------------------------- */}
      <section id="how" className="scroll-mt-20 py-20">
        <div className="container-page">
          <div className="rounded-[2.5rem] bg-forest-600 p-8 text-sand-100 sm:p-14">
            <span className="eyebrow !text-ochre-400">{th("eyebrow")}</span>
            <h2 className="mt-3 max-w-2xl font-display text-4xl text-sand-50 text-balance">
              {th("title")}
            </h2>

            <ol className="mt-12 grid gap-8 md:grid-cols-4">
              {steps.map(({ key, Icon }, i) => (
                <li key={key} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ochre-500 font-display text-lg font-semibold text-forest-700">
                      {i + 1}
                    </span>
                    <Icon size={20} className="text-ochre-400" />
                  </div>
                  <h3 className="mt-4 font-display text-lg text-sand-50">
                    {th(`steps.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-sand-200/80">
                    {th(`steps.${key}.text`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
