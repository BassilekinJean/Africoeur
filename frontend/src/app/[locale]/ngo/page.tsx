import { getTranslations, setRequestLocale } from "next-intl/server";
import { Globe2 } from "lucide-react";

import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

export default async function NgoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ngo");
  const projects = await getCampaigns({ type: "ngo_project" });

  return (
    <div className="container-page py-14">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-50 text-forest-500">
          <Globe2 size={24} />
        </div>
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl text-ink sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-ink-soft">{t("subtitle")}</p>
        </div>
      </header>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">{t("initiatives")}</h2>
        <div className="stagger mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((c) => (
            <CampaignCard key={c.id} c={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
