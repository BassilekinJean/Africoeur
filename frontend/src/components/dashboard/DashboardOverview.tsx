"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  Globe2,
  ShieldCheck,
  Loader2,
  Wallet,
  Activity,
  Clock3,
  FileCheck2,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import { useRouter } from "@/i18n/routing";

interface Me {
  full_name: string;
  email: string;
  role: "hospital_agent" | "ngo_agent" | "admin" | "donor";
  organization_name: string | null;
}

const ROLE_META = {
  hospital_agent: { key: "hospital", Icon: Building2 },
  ngo_agent: { key: "ngo", Icon: Globe2 },
  admin: { key: "admin", Icon: ShieldCheck },
  donor: { key: "hospital", Icon: Building2 },
} as const;

export function DashboardOverview() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/me/`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) setMe(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-ink-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <ShieldCheck className="mx-auto text-clay-500" />
        <p className="mt-3 text-ink-soft">
          {t("comingSoon")}
        </p>
      </div>
    );
  }

  const meta = ROLE_META[me.role];
  const isAdmin = me.role === "admin";

  const cards = isAdmin
    ? [
        { Icon: Wallet, label: t("collected"), value: "—" },
        { Icon: Clock3, label: t("pendingReview"), value: "—" },
        { Icon: FileCheck2, label: t("pendingDisbursements"), value: "—" },
        { Icon: ShieldCheck, label: t("certifications"), value: "—" },
      ]
    : [
        { Icon: Wallet, label: t("collected"), value: "—" },
        { Icon: Activity, label: t("active"), value: "—" },
        { Icon: Clock3, label: t("pendingReview"), value: "—" },
        { Icon: FileCheck2, label: t("pendingDisbursements"), value: "—" },
      ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
            <meta.Icon size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {t(meta.key)}
            </p>
            <h1 className="font-display text-2xl text-ink">
              {t("welcome")}, {me.full_name || me.email}
            </h1>
            {me.organization_name && (
              <p className="text-sm text-ink-soft">{me.organization_name}</p>
            )}
          </div>
        </div>
        {!isAdmin && (
          <button className="btn-primary !py-2.5">{t("newCampaign")}</button>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div key={i} className="card p-5">
            <c.Icon size={20} className="text-ink-muted" />
            <p className="mt-3 font-display text-3xl font-semibold text-ink">{c.value}</p>
            <p className="text-sm text-ink-soft">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-8 text-center">
        <p className="text-ink-soft">{t("comingSoon")}</p>
        <p className="mt-2 text-xs text-ink-muted">
          API : <code className="rounded bg-ink/5 px-1.5 py-0.5">{API_BASE}/campaigns/</code> ·{" "}
          <code className="rounded bg-ink/5 px-1.5 py-0.5">{API_BASE}/disbursements/</code>
        </p>
      </div>
    </div>
  );
}
