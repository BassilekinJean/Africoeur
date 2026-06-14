import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchX } from "lucide-react";

import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { Filters } from "@/components/campaigns/Filters";

export default async function CampaignsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; category?: string; country?: string; search?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("campaigns");
  const campaigns = await getCampaigns(filters);

  return (
    <div className="container-page py-14">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 text-lg text-ink-soft">{t("subtitle")}</p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Filters current={filters} />
        </aside>

        <div>
          {campaigns.length === 0 ? (
            <div className="card flex flex-col items-center justify-center gap-3 py-24 text-center">
              <SearchX size={36} className="text-ink-muted" />
              <p className="text-ink-soft">{t("empty")}</p>
            </div>
          ) : (
            <div className="stagger grid gap-6 sm:grid-cols-2">
              {campaigns.map((c) => (
                <CampaignCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
