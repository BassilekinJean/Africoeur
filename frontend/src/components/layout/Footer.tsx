import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Logo } from "./Logo";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="mt-24 border-t border-ink/8 bg-forest-600 text-sand-100">
      <div className="kente-rule" />
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo className="[&_span:last-child]:text-sand-50 [&_.text-ink]:text-sand-50" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand-200/80">
            {t("tagline")}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest-700/60 px-3 py-1.5 text-xs text-sand-100">
            <ShieldCheck size={14} className="text-ochre-400" />
            {t("compliance")}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-sand-200/70">
            {t("platform")}
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-sand-200/85">
            <li><Link href="/campaigns" className="hover:text-sand-50">{nav("campaigns")}</Link></li>
            <li><Link href="/ngo" className="hover:text-sand-50">{nav("ngo")}</Link></li>
            <li><Link href="/login" className="hover:text-sand-50">{nav("login")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-sand-200/70">
            {t("legal")}
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-sand-200/85">
            <li><Link href="/legal/cgu" className="hover:text-sand-50">{t("cgu")}</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-sand-50">{t("privacy")}</Link></li>
            <li><Link href="/legal/ethics" className="hover:text-sand-50">{t("ethics")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sand-100/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-sand-200/60 sm:flex-row">
          <span>© {new Date().getFullYear()} Africœur. {t("rights")}</span>
          <span>Yaoundé · Douala · Abidjan · Dakar</span>
        </div>
      </div>
    </footer>
  );
}
