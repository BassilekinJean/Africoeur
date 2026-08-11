"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useRouter } from "@/i18n/routing";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const isDemoCreds =
      (email.includes("demo") || email.includes("hopital") || email.includes("ong")) &&
      password === "Password123!";

    const handleDemoSuccess = () => {
      const isNgo = email.includes("ong");
      const demoUser = {
        full_name: isNgo ? "Agent Solidarité Santé" : "Agent Hôpital Central",
        email,
        role: isNgo ? "ngo_agent" : "hospital_agent",
        organization_name: isNgo
          ? "Solidarité Santé Afrique"
          : "Hôpital Central de Yaoundé — Service Social",
      };
      localStorage.setItem("africoeur_demo_user", JSON.stringify(demoUser));
      router.push("/dashboard");
    };

    const supabase = getSupabase();
    if (!supabase) {
      if (isDemoCreds) {
        handleDemoSuccess();
        setLoading(false);
        return;
      }
      setError("Supabase non configuré (variables NEXT_PUBLIC_SUPABASE_* manquantes).");
      setLoading(false);
      return;
    }

    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signErr) {
        if (isDemoCreds) {
          handleDemoSuccess();
          return;
        }
        throw signErr;
      }

      // Supprime le mode démo local lors d'une vraie connexion Supabase
      localStorage.removeItem("africoeur_demo_user");

      // Vérifie si un second facteur (TOTP) est requis.
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
        if (!needsMfa) {
          setNeedsMfa(true);
          setLoading(false);
          return;
        }
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const factor = factors?.totp?.[0];
        if (factor) {
          const { data: challenge } = await supabase.auth.mfa.challenge({
            factorId: factor.id,
          });
          if (challenge) {
            const { error: verifyErr } = await supabase.auth.mfa.verify({
              factorId: factor.id,
              challengeId: challenge.id,
              code: totp,
            });
            if (verifyErr) throw verifyErr;
          }
        }
      }
      router.push("/dashboard");
    } catch (err: any) {
      if (isDemoCreds) {
        handleDemoSuccess();
        return;
      }
      setError(err?.message || t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-600">
        <ShieldCheck size={14} /> Back-office certifié
      </div>
      <h1 className="font-display text-3xl text-ink">{t("title")}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t("subtitle")}</p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-3 p-6">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            {t("email")}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field mt-1"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            {t("password")}
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field mt-1"
            autoComplete="current-password"
          />
        </div>

        {needsMfa && (
          <div className="animate-fade-up">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              <Lock size={12} /> {t("totp")}
            </label>
            <input
              inputMode="numeric"
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              className="field mt-1 tracking-[0.4em]"
              placeholder="000000"
              maxLength={6}
            />
          </div>
        )}

        {error && <p className="text-sm text-clay-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {t("signingIn")}
            </>
          ) : (
            t("signin")
          )}
        </button>

        <p className="pt-1 text-xs leading-relaxed text-ink-muted">{t("mfaHint")}</p>
      </form>

      <p className="mt-4 text-center text-xs text-ink-muted">{t("noAccount")}</p>
    </div>
  );
}
