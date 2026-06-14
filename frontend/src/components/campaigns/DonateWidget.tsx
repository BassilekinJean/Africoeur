"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Loader2, Share2, Check } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { formatAmount } from "@/lib/utils";

const PRESETS = [5000, 10000, 25000, 50000];
const GATEWAYS = ["cinetpay", "campay", "flutterwave"] as const;

export function DonateWidget({
  slug,
  currency,
  commissionRate,
}: {
  slug: string;
  currency: string;
  commissionRate: string;
}) {
  const t = useTranslations("donate");
  const locale = useLocale();
  const [amount, setAmount] = useState(10000);
  const [gateway, setGateway] = useState<(typeof GATEWAYS)[number]>("cinetpay");
  const [anonymous, setAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const formattedAmount = useMemo(
    () => formatAmount(amount, currency, locale),
    [amount, currency, locale],
  );

  async function submit() {
    if (amount <= 0) return;
    setState("loading");
    try {
      const res = await fetch(`${API_BASE}/donations/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_slug: slug,
          amount,
          currency,
          gateway,
          is_anonymous: anonymous,
          donor_name: anonymous ? "" : name,
          donor_email: email,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setState("success");
      if (data.payment_url) {
        setTimeout(() => {
          window.location.href = data.payment_url;
        }, 900);
      }
    } catch {
      setState("error");
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
      } catch {
        /* annulé */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="card sticky top-24 p-6">
      <h3 className="font-display text-xl text-ink">{t("title")}</h3>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-[transform,background-color] duration-200 active:scale-[0.96] ${
              amount === p
                ? "border-clay-500 bg-clay-500 text-sand-50"
                : "border-ink/12 bg-white/70 text-ink-soft hover:border-ink/25"
            }`}
          >
            {p.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {t("amount")}
        </label>
        <div className="relative mt-1">
          <input
            type="number"
            min={500}
            step={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="field pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted">
            {currency}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {t("method")}
        </label>
        <div className="mt-2 flex flex-col gap-2">
          {GATEWAYS.map((g) => (
            <button
              key={g}
              onClick={() => setGateway(g)}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200 ${
                gateway === g
                  ? "border-clay-500 bg-clay-50 text-ink"
                  : "border-ink/12 bg-white/60 text-ink-soft hover:border-ink/25"
              }`}
            >
              {t(`methods.${g}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {!anonymous && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            className="field"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email")}
          className="field"
        />
        <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-ink/30 text-clay-500 focus:ring-clay-400"
          />
          {t("anonymous")}
        </label>
      </div>

      <p className="mt-3 rounded-xl bg-sand-100 px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
        {t("commissionNotice", { rate: commissionRate })}
      </p>

      <button
        onClick={submit}
        disabled={state === "loading" || state === "success"}
        className="btn-primary mt-4 w-full disabled:opacity-70"
      >
        {state === "loading" ? (
          <>
            <Loader2 size={16} className="animate-spin" /> {t("submitting")}
          </>
        ) : state === "success" ? (
          <>
            <Check size={16} /> {t("success")}
          </>
        ) : (
          <>
            <Heart size={15} strokeWidth={2.4} /> {t("submit", { amount: formattedAmount })}
          </>
        )}
      </button>

      {state === "error" && (
        <p className="mt-2 text-center text-xs text-clay-600">{t("error")}</p>
      )}

      <button
        onClick={share}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <Share2 size={15} /> {t("share")}
      </button>
    </div>
  );
}
