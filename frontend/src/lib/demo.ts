import type { Campaign, CampaignDetail, DonationPublic } from "@/types/api";

/**
 * Données de démonstration utilisées en repli lorsque l'API Django n'est pas
 * encore joignable (développement / aperçu statique). En production, ces données
 * proviennent du backend (`/api/v1/campaigns/`).
 */
const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=1200&q=70`;

export const DEMO_CAMPAIGNS: CampaignDetail[] = [
  {
    id: "demo-1",
    type: "medical",
    category: "health",
    title: "Opération du cœur pour Awa, 7 ans",
    slug: "operation-coeur-awa",
    summary:
      "Une opération cardiaque urgente pour permettre à Awa de grandir en bonne santé.",
    country: "CM",
    target_amount: "4500000",
    collected_amount: "2870000",
    currency: "XAF",
    donor_count: 184,
    progress_pct: 63.8,
    cover_image_path: img("photo-1576765608535-5f04d1e3f289"),
    status: "active",
    deadline: "2026-07-20",
    organization_name: "Hôpital Central de Yaoundé — Service Social",
    organization_type: "hospital",
    published_at: "2026-05-01",
    description:
      "Awa, 7 ans, présente une pathologie nécessitant une intervention chirurgicale cardiaque. Le service social de l'Hôpital Central accompagne sa famille pour réunir le montant du devis hospitalier. La cagnotte est entièrement administrée par l'établissement.",
    video_path: "",
    patient: {
      display_name: "Awa N.",
      age: 7,
      is_minor: true,
      general_situation:
        "Enfant de 7 ans, pathologie cardiaque nécessitant une opération.",
      display_level: 1,
      photo_path: "",
      video_path: "",
    },
    field_updates: [],
    fund_usage_reports: [],
  },
  {
    id: "demo-2",
    type: "medical",
    category: "emergency",
    title: "Prise en charge des grands brûlés — Joseph",
    slug: "grands-brules-joseph",
    summary:
      "Soins d'urgence et greffes pour Joseph après un accident domestique.",
    country: "CM",
    target_amount: "2800000",
    collected_amount: "1190000",
    currency: "XAF",
    donor_count: 97,
    progress_pct: 42.5,
    cover_image_path: img("photo-1612277795421-9bc7706a4a34"),
    status: "active",
    deadline: "2026-07-05",
    organization_name: "Hôpital Central de Yaoundé — Service Social",
    organization_type: "hospital",
    published_at: "2026-05-10",
    description:
      "Joseph a été victime de graves brûlures. La prise en charge nécessite plusieurs interventions et un suivi prolongé sous la supervision du service social.",
    video_path: "",
    patient: {
      display_name: "Joseph K.",
      age: 29,
      is_minor: false,
      general_situation:
        "Adulte, brûlures graves nécessitant des greffes successives.",
      display_level: 1,
      photo_path: "",
      video_path: "",
    },
    field_updates: [],
    fund_usage_reports: [],
  },
  {
    id: "demo-3",
    type: "ngo_project",
    category: "education",
    title: "Une école pour le village de Bangou",
    slug: "ecole-bangou",
    summary: "Construire trois salles de classe pour 120 enfants déscolarisés.",
    country: "CM",
    target_amount: "8000000",
    collected_amount: "5200000",
    currency: "XAF",
    donor_count: 312,
    progress_pct: 65,
    cover_image_path: img("photo-1503676260728-1c00da094a0b"),
    status: "active",
    deadline: "2026-09-01",
    organization_name: "Solidarité Santé Afrique",
    organization_type: "ngo",
    published_at: "2026-04-15",
    description:
      "Le projet vise à construire et équiper trois salles de classe afin d'accueillir 120 enfants aujourd'hui privés d'école. Un rapport d'utilisation des fonds est publié à chaque tranche débloquée.",
    video_path: "",
    patient: null,
    field_updates: [
      {
        id: "fu-1",
        title: "Fondations terminées",
        content:
          "Les fondations des trois salles sont coulées. Merci à tous les donateurs !",
        media_paths: [],
        created_at: "2026-05-20",
      },
    ],
    fund_usage_reports: [
      {
        id: "fr-1",
        title: "Tranche 1 — matériaux",
        description: "Achat de ciment, briques et fer à béton.",
        amount_used: "1800000",
        attachment_paths: [],
        created_at: "2026-05-18",
      },
    ],
  },
  {
    id: "demo-4",
    type: "ngo_project",
    category: "development",
    title: "Accès à l'eau potable — forages solaires",
    slug: "eau-potable-forages",
    summary: "Installer 5 forages solaires pour 2 000 habitants.",
    country: "TG",
    target_amount: "6000000",
    collected_amount: "980000",
    currency: "XAF",
    donor_count: 58,
    progress_pct: 16.3,
    cover_image_path: img("photo-1594761051556-eca6b5d7fa9c"),
    status: "active",
    deadline: "2026-10-10",
    organization_name: "Solidarité Santé Afrique",
    organization_type: "ngo",
    published_at: "2026-05-22",
    description:
      "Installation de forages équipés de pompes solaires pour garantir un accès durable à l'eau potable dans des zones rurales reculées.",
    video_path: "",
    patient: null,
    field_updates: [],
    fund_usage_reports: [],
  },
];

export const DEMO_DONORS: DonationPublic[] = [
  {
    id: "d1",
    donor_name: "Diaspora CM",
    amount: "50000",
    currency: "XAF",
    message: "Courage à la famille 🙏",
    created_at: "2026-05-30",
  },
  {
    id: "d2",
    donor_name: "Donateur anonyme",
    amount: "25000",
    currency: "XAF",
    message: "",
    created_at: "2026-05-29",
  },
  {
    id: "d3",
    donor_name: "Association Espoir",
    amount: "100000",
    currency: "XAF",
    message: "Toute notre solidarité.",
    created_at: "2026-05-27",
  },
];

export const asListItem = (c: CampaignDetail): Campaign => c;
