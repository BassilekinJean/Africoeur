import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

const DOCS: Record<string, { fr: { title: string; body: string }; en: { title: string; body: string } }> = {
  cgu: {
    fr: {
      title: "Conditions générales d'utilisation",
      body: "Les présentes CGU encadrent l'usage de la plateforme par les visiteurs, les donateurs et les partenaires institutionnels (hôpitaux, ONG). Document à finaliser avec un conseil juridique spécialisé en droit OHADA.",
    },
    en: {
      title: "Terms of use",
      body: "These terms govern the use of the platform by visitors, donors and institutional partners (hospitals, NGOs). Document to be finalised with OHADA legal counsel.",
    },
  },
  privacy: {
    fr: {
      title: "Politique de confidentialité",
      body: "Aucune donnée médicale confidentielle n'est stockée. Le profil patient est strictement minimal, les contacts du tuteur sont chiffrés et jamais affichés. Conforme RGPD pour la diaspora européenne.",
    },
    en: {
      title: "Privacy policy",
      body: "No confidential medical data is stored. The patient profile is strictly minimal, guardian contacts are encrypted and never displayed. GDPR-compliant for the European diaspora.",
    },
  },
  ethics: {
    fr: {
      title: "Charte éthique",
      body: "Transparence des fonds, dispositif anti-fraude, anti-corruption. La famille n'a jamais accès aux fonds ; le déblocage est conditionné à des justificatifs validés par l'administrateur.",
    },
    en: {
      title: "Ethics charter",
      body: "Fund transparency, anti-fraud and anti-corruption measures. The family never accesses the funds; release is conditional on documents validated by the administrator.",
    },
  },
};

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  setRequestLocale(locale);
  const entry = DOCS[doc];
  if (!entry) notFound();
  const content = entry[locale === "en" ? "en" : "fr"];

  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="font-display text-4xl text-ink">{content.title}</h1>
      <div className="kente-rule mt-4 w-24" />
      <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">{content.body}</p>
    </div>
  );
}
