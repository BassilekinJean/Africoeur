"use client";

import { useEffect, useState, useMemo } from "react";
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
  LogOut,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowUpRight,
  Send,
  RefreshCw,
  Layers,
  UserCheck,
  Briefcase,
  ExternalLink,
  ChevronRight,
  X,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import {
  API_BASE,
  getMe,
  getDashboardCampaigns,
  createCampaign,
  submitCampaign,
  approveCampaign,
  rejectCampaign,
  closeCampaign,
  createFieldUpdate,
  createFundUsageReport,
  getDisbursements,
  createDisbursement,
  approveDisbursement,
  rejectDisbursement,
  markDisbursementPaid,
  getOrganizations,
  getMyOrganization,
  updateMyOrganization,
  certifyOrganization,
} from "@/lib/api";
import { useRouter, Link } from "@/i18n/routing";
import { formatAmount } from "@/lib/utils";
import type {
  CampaignDetail,
  CampaignType,
  CampaignCategory,
  CampaignWriteInput,
  DisbursementRequest,
  DisbursementMethod,
  Organization,
  UserProfile,
  Role,
} from "@/types/api";

const ROLE_META = {
  hospital_agent: { key: "hospital", label: "Service Social — Hôpital", Icon: Building2 },
  ngo_agent: { key: "ngo", label: "Espace ONG", Icon: Globe2 },
  admin: { key: "admin", label: "Administration Plateforme", Icon: ShieldCheck },
  donor: { key: "hospital", label: "Donateur", Icon: Building2 },
} as const;

type ActiveTab = "overview" | "campaigns" | "disbursements" | "organization";

export function DashboardOverview() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  // State
  const [me, setMe] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Data
  const [campaigns, setCampaigns] = useState<CampaignDetail[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementRequest[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [myOrganization, setMyOrganization] = useState<Organization | null>(null);

  // Filters & Search
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [campaignSearch, setCampaignSearch] = useState<string>("");
  const [disbursementFilter, setDisbursementFilter] = useState<string>("all");

  // Feedback Toasts / Notices
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Modals state
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showNewDisbursementModal, setShowNewDisbursementModal] = useState(false);
  const [showFieldUpdateModal, setShowFieldUpdateModal] = useState<string | null>(null); // campaign id
  const [showFundReportModal, setShowFundReportModal] = useState<string | null>(null); // campaign id
  const [showModerationModal, setShowModerationModal] = useState<{
    type: "approve_campaign" | "reject_campaign" | "close_campaign" | "approve_disbursement" | "reject_disbursement" | "pay_disbursement";
    idOrSlug: string;
    title: string;
  } | null>(null);

  // Form inputs
  const [moderationNote, setModerationNote] = useState("");
  const [bankRefInput, setBankRefInput] = useState("");

  // New Campaign Form State
  const [newCampaignForm, setNewCampaignForm] = useState<CampaignWriteInput>({
    type: "medical",
    category: "health",
    title: "",
    summary: "",
    description: "",
    country: "CM",
    target_amount: "",
    currency: "XAF",
    cover_image_path: "",
    video_path: "",
    deadline: "",
    budget_justification_path: "legal-docs/devis-estimation.pdf",
    consent_form_path: "legal-docs/decharge-droit-image.pdf",
    internal_notes: "",
  });

  // New Disbursement Form State
  const [newDisbursementForm, setNewDisbursementForm] = useState<{
    campaign: string;
    amount: string;
    method: DisbursementMethod;
    beneficiary_name: string;
    purpose: string;
    justification_path: string;
  }>({
    campaign: "",
    amount: "",
    method: "direct_transfer",
    beneficiary_name: "",
    purpose: "",
    justification_path: "legal-docs/facture-fournisseur.pdf",
  });

  // Field Update Form State
  const [fieldUpdateForm, setFieldUpdateForm] = useState({
    title: "",
    content: "",
  });

  // Fund Usage Report Form State
  const [fundReportForm, setFundReportForm] = useState({
    title: "",
    description: "",
    amount_used: "",
  });

  // Initial Load
  const loadDashboardData = async (authToken?: string) => {
    setRefreshing(true);
    try {
      const [cList, dList, oList] = await Promise.all([
        getDashboardCampaigns(authToken),
        getDisbursements(authToken),
        getOrganizations(authToken),
      ]);
      setCampaigns(cList);
      setDisbursements(dList);
      setOrganizations(oList);

      if (authToken) {
        const org = await getMyOrganization(authToken);
        setMyOrganization(org);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      const savedDemoUser =
        typeof window !== "undefined" ? localStorage.getItem("africoeur_demo_user") : null;

      let authToken: string | undefined = undefined;
      const supabase = getSupabase();
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          authToken = session.access_token;
          setToken(authToken);
        }
      }

      if (authToken) {
        const meData = await getMe(authToken);
        if (meData) {
          setMe(meData);
        } else if (savedDemoUser) {
          try {
            const parsed = JSON.parse(savedDemoUser);
            const demoToken = parsed.demo_token || `demo:${parsed.email}`;
            setMe({
              id: "demo-user-id",
              supabase_user_id: "demo-user-id",
              email: parsed.email,
              full_name: parsed.full_name,
              role: parsed.role,
              organization: "org-1",
              organization_name: parsed.organization_name,
              organization_type: parsed.role === "ngo_agent" ? "ngo" : "hospital",
              locale: "fr",
              is_active: true,
              created_at: new Date().toISOString(),
            });
            authToken = demoToken;
            setToken(authToken);
          } catch {
            localStorage.removeItem("africoeur_demo_user");
          }
        }
      } else if (savedDemoUser) {
        try {
          const parsed = JSON.parse(savedDemoUser);
          const demoToken = parsed.demo_token || `demo:${parsed.email}`;
          setMe({
            id: "demo-user-id",
            supabase_user_id: "demo-user-id",
            email: parsed.email,
            full_name: parsed.full_name,
            role: parsed.role,
            organization: "org-1",
            organization_name: parsed.organization_name,
            organization_type: parsed.role === "ngo_agent" ? "ngo" : "hospital",
            locale: "fr",
            is_active: true,
            created_at: new Date().toISOString(),
          });
          authToken = demoToken;
          setToken(authToken);
        } catch {
          localStorage.removeItem("africoeur_demo_user");
        }
      } else {
        router.replace("/login");
        return;
      }

      await loadDashboardData(authToken);
      setLoading(false);
    })();
  }, [router]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleLogout = async () => {
    localStorage.removeItem("africoeur_demo_user");
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  // Computations & Stats
  const isAdmin = me?.role === "admin";
  const isHospital = me?.role === "hospital_agent";
  const isNgo = me?.role === "ngo_agent";

  const totalCollected = useMemo(() => {
    return campaigns.reduce(
      (acc, c) => acc + (parseFloat(c.collected_amount) || 0),
      0
    );
  }, [campaigns]);

  const activeCount = useMemo(() => {
    return campaigns.filter((c) => c.status === "active").length;
  }, [campaigns]);

  const pendingReviewCount = useMemo(() => {
    return campaigns.filter((c) => c.status === "pending_review").length;
  }, [campaigns]);

  const pendingDisbursementsCount = useMemo(() => {
    return disbursements.filter((d) => d.status === "pending").length;
  }, [disbursements]);

  const pendingCertificationsCount = useMemo(() => {
    return organizations.filter((o) => o.certification_status === "pending").length;
  }, [organizations]);

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (campaignFilter !== "all" && c.status !== campaignFilter) return false;
      if (
        campaignSearch &&
        !`${c.title} ${c.summary} ${c.organization_name}`
          .toLowerCase()
          .includes(campaignSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [campaigns, campaignFilter, campaignSearch]);

  const filteredDisbursements = useMemo(() => {
    return disbursements.filter((d) => {
      if (disbursementFilter !== "all" && d.status !== disbursementFilter) return false;
      return true;
    });
  }, [disbursements, disbursementFilter]);

  // Handlers for campaign actions
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newCampaignForm.title.trim() ||
      !newCampaignForm.description.trim() ||
      !newCampaignForm.target_amount ||
      !newCampaignForm.deadline
    ) {
      showToast(
        "Veuillez remplir le titre, la description, le montant cible et la date limite de l’appel.",
        "error",
      );
      return;
    }

    const payload = {
      ...newCampaignForm,
      title: newCampaignForm.title.trim(),
      deadline: newCampaignForm.deadline,
      summary: newCampaignForm.summary || "",
      description: newCampaignForm.description.trim(),
      cover_image_path: newCampaignForm.cover_image_path || "",
      video_path: newCampaignForm.video_path || "",
      internal_notes: newCampaignForm.internal_notes || "",
    };

    setCreatingCampaign(true);
    try {
      const res = await createCampaign(payload, token);
      if (res.success) {
        showToast("Campagne créée avec succès !");
        setShowNewCampaignModal(false);
        await loadDashboardData(token);
      } else {
        showToast(res.error || "Erreur lors de la création de la campagne.", "error");
      }
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleSubmitCampaign = async (slug: string) => {
    const res = await submitCampaign(slug, token);
    if (res.success) {
      showToast("Campagne soumise à la modération !");
      await loadDashboardData(token);
    } else {
      showToast(res.error || "Formulaire de décharge requis avant soumission.", "error");
    }
  };

  const handleModerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showModerationModal) return;

    const { type, idOrSlug } = showModerationModal;
    let res;

    if (type === "approve_campaign") {
      res = await approveCampaign(idOrSlug, moderationNote, token);
    } else if (type === "reject_campaign") {
      res = await rejectCampaign(idOrSlug, moderationNote, token);
    } else if (type === "close_campaign") {
      if (!moderationNote.trim()) {
        showToast("Le motif de clôture est obligatoire.", "error");
        return;
      }
      res = await closeCampaign(idOrSlug, moderationNote, token);
    } else if (type === "approve_disbursement") {
      res = await approveDisbursement(idOrSlug, moderationNote, token);
    } else if (type === "reject_disbursement") {
      res = await rejectDisbursement(idOrSlug, moderationNote, token);
    } else if (type === "pay_disbursement") {
      if (!bankRefInput.trim()) {
        showToast("La référence bancaire est obligatoire.", "error");
        return;
      }
      res = await markDisbursementPaid(idOrSlug, bankRefInput, token);
    }

    if (res?.success) {
      showToast("Action effectuée avec succès !");
      setShowModerationModal(null);
      setModerationNote("");
      setBankRefInput("");
      await loadDashboardData(token);
    } else {
      showToast(res?.error || "Erreur lors du traitement.", "error");
    }
  };

  const handleCreateDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newDisbursementForm.campaign ||
      !newDisbursementForm.amount ||
      !newDisbursementForm.beneficiary_name ||
      !newDisbursementForm.purpose
    ) {
      showToast(
        "Veuillez remplir tous les champs obligatoires : campagne, montant, bénéficiaire et objet de la dépense.",
        "error"
      );
      return;
    }
    if (Number(newDisbursementForm.amount) <= 0) {
      showToast("Le montant demandé doit être supérieur à 0.", "error");
      return;
    }
    if (!token) {
      showToast("Authentification requise pour créer un déblocage.", "error");
      return;
    }
    const res = await createDisbursement(
      {
        ...newDisbursementForm,
        justification_paths: [newDisbursementForm.justification_path],
      },
      token
    );
    if (res.success) {
      showToast("Demande de déblocage transmise à l'administration.");
      setShowNewDisbursementModal(false);
      await loadDashboardData(token);
    } else {
      showToast(res.error || "Erreur lors de la demande de déblocage.", "error");
    }
  };

  const handleCreateFieldUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFieldUpdateModal || !fieldUpdateForm.title || !fieldUpdateForm.content) return;
    if (!token) {
      showToast("Authentification requise pour publier une mise à jour.", "error");
      return;
    }
    const res = await createFieldUpdate(
      {
        campaign: showFieldUpdateModal,
        title: fieldUpdateForm.title,
        content: fieldUpdateForm.content,
      },
      token
    );
    if (res.success) {
      showToast("Mise à jour de terrain publiée !");
      setShowFieldUpdateModal(null);
      setFieldUpdateForm({ title: "", content: "" });
      await loadDashboardData(token);
    } else {
      showToast("Erreur lors de la publication.", "error");
    }
  };

  const handleCreateFundReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFundReportModal || !fundReportForm.title || !fundReportForm.amount_used) return;
    if (!token) {
      showToast("Authentification requise pour publier un rapport.", "error");
      return;
    }
    const res = await createFundUsageReport(
      {
        campaign: showFundReportModal,
        title: fundReportForm.title,
        description: fundReportForm.description,
        amount_used: fundReportForm.amount_used,
      },
      token
    );
    if (res.success) {
      showToast("Rapport d'utilisation des fonds publié !");
      setShowFundReportModal(null);
      setFundReportForm({ title: "", description: "", amount_used: "" });
      await loadDashboardData(token);
    } else {
      showToast("Erreur lors de la publication.", "error");
    }
  };

  const handleCertifyOrg = async (id: string) => {
    if (!token) {
      showToast("Authentification requise pour certifier une organisation.", "error");
      return;
    }
    const res = await certifyOrganization(id, token);
    if (res.success) {
      showToast("Organisation certifiée avec succès !");
      await loadDashboardData(token);
    } else {
      showToast(res.error || "Erreur lors de la certification.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-muted">
        <Loader2 className="animate-spin text-clay-500" size={32} />
        <p className="text-sm font-medium">{t("loading")}</p>
      </div>
    );
  }

  if (!me) return null;

  const meta = ROLE_META[me.role] || ROLE_META.hospital_agent;
  const organizationView = isAdmin ? organizations : myOrganization ? [myOrganization] : [];

  const cards = isAdmin
    ? [
        { Icon: Wallet, label: t("collected"), value: formatAmount(totalCollected) },
        { Icon: Clock3, label: t("pendingReview"), value: pendingReviewCount.toString() },
        { Icon: FileCheck2, label: t("pendingDisbursements"), value: pendingDisbursementsCount.toString() },
        { Icon: ShieldCheck, label: t("certifications"), value: pendingCertificationsCount.toString() },
      ]
    : [
        { Icon: Wallet, label: t("collected"), value: formatAmount(totalCollected) },
        { Icon: Activity, label: t("active"), value: activeCount.toString() },
        { Icon: Clock3, label: t("pendingReview"), value: pendingReviewCount.toString() },
        { Icon: FileCheck2, label: t("pendingDisbursements"), value: pendingDisbursementsCount.toString() },
      ];

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl backdrop-blur-md transition-all ${
            feedback.type === "success"
              ? "bg-forest-500 text-white"
              : "bg-clay-600 text-white"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/70 p-6 shadow-soft backdrop-blur border border-ink/5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-50 text-clay-600 shadow-inner">
            <meta.Icon size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">{meta.label}</span>
              {me.organization_name && (
                <span className="chip !bg-clay-50 !text-clay-700 !border-clay-200">
                  {me.organization_name}
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {t("welcome")}, {me.full_name || me.email}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              void loadDashboardData(token);
            }}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink"
            title="Rafraîchir"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          {!isAdmin && (
            <button
              onClick={() => setShowNewCampaignModal(true)}
              className="btn-primary !py-2.5 text-xs sm:text-sm"
            >
              <Plus size={16} /> {t("newCampaign")}
            </button>
          )}

          <button
            onClick={() => setShowNewDisbursementModal(true)}
            className="btn-secondary !py-2.5 text-xs sm:text-sm"
          >
            <Wallet size={16} /> Demande de déblocage
          </button>

          <button
            onClick={handleLogout}
            className="btn-ghost flex items-center gap-1.5 text-xs text-clay-600 hover:text-clay-700 !py-2.5"
            title="Se déconnecter"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div
            key={i}
            className="card relative overflow-hidden p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {c.label}
              </span>
              <div className="rounded-xl bg-sand-100 p-2 text-clay-600">
                <c.Icon size={20} />
              </div>
            </div>
            <p className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-ink/10">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "overview"
              ? "border-clay-500 text-clay-600 font-semibold"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Layers size={16} /> Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "campaigns"
              ? "border-clay-500 text-clay-600 font-semibold"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Activity size={16} /> {t("myCampaigns")} ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab("disbursements")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "disbursements"
              ? "border-clay-500 text-clay-600 font-semibold"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Wallet size={16} /> {t("disbursements")} ({disbursements.length})
        </button>
        <button
          onClick={() => setActiveTab("organization")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "organization"
              ? "border-clay-500 text-clay-600 font-semibold"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Building2 size={16} /> {isAdmin ? "Organisations" : "Mon Organisation"}
        </button>
      </div>

      {/* TAB 1: VUE D'ENSEMBLE */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Actions & Compliance */}
            <div className="card p-6 space-y-4 lg:col-span-1">
              <h3 className="font-display text-lg font-semibold text-ink">Espace Réglementaire</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                Conformément à la charte Africœur, aucune somme ne transit directement vers les comptes personnels. Le déblocage s'effectue exclusivement par virement aux hôpitaux / fournisseurs ou par chèque conditionné.
              </p>

              <div className="space-y-2 pt-2 border-t border-ink/5 text-xs text-ink-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest-500" /> Validation a priori des dossiers
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest-500" /> Modération stricte par l'administration
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest-500" /> Rapports d'utilisation obligatoires
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowNewCampaignModal(true)}
                  className="btn-primary w-full text-xs"
                >
                  <Plus size={14} /> Créer un nouvel appel
                </button>
              </div>
            </div>

            {/* Recent Campaigns Overview */}
            <div className="card p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-ink">Appels récents</h3>
                <button
                  onClick={() => setActiveTab("campaigns")}
                  className="text-xs font-semibold text-clay-600 hover:underline flex items-center gap-1"
                >
                  Tout voir <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {campaigns.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sand-50/60 p-4 border border-ink/5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`chip text-[10px] uppercase font-bold ${
                            c.status === "active"
                              ? "!bg-forest-50 !text-forest-600"
                              : c.status === "pending_review"
                              ? "!bg-ochre-50 !text-ochre-600"
                              : c.status === "draft"
                              ? "!bg-ink/5 !text-ink-muted"
                              : "!bg-clay-50 !text-clay-600"
                          }`}
                        >
                          {c.status}
                        </span>
                        <span className="text-xs text-ink-muted">{c.category}</span>
                      </div>
                      <p className="font-medium text-sm text-ink line-clamp-1">{c.title}</p>
                    </div>

                    <div className="text-right text-xs">
                      <p className="font-semibold text-ink">
                        {formatAmount(c.collected_amount)} / {formatAmount(c.target_amount)}
                      </p>
                      <p className="text-ink-muted">{c.progress_pct.toFixed(0)}% financé</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPELS À L'AIDE */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Rechercher par titre..."
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  className="field !pl-9 !py-2 text-xs w-60"
                />
              </div>

              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="field !py-2 text-xs w-40"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="pending_review">En modération</option>
                <option value="active">En cours</option>
                <option value="closed">Clôturé</option>
                <option value="funded">Atteint</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>

            {!isAdmin && (
              <button onClick={() => setShowNewCampaignModal(true)} className="btn-primary text-xs">
                <Plus size={14} /> Créer un appel
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((c) => (
              <div key={c.id} className="card flex flex-col justify-between p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`chip text-[10px] uppercase font-bold ${
                        c.status === "active"
                          ? "!bg-forest-50 !text-forest-600"
                          : c.status === "pending_review"
                          ? "!bg-ochre-50 !text-ochre-600"
                          : c.status === "draft"
                          ? "!bg-ink/5 !text-ink-muted"
                          : "!bg-clay-50 !text-clay-600"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-[11px] text-ink-muted">{c.type === "medical" ? "Medical" : "Projet ONG"}</span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-ink mt-2 line-clamp-2">
                    {c.title}
                  </h3>
                  <p className="text-xs text-ink-soft mt-1 line-clamp-2">{c.summary}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-ink/5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-ink-muted">Objectif:</span>
                    <span className="text-ink">{formatAmount(c.target_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-ink-muted">Collecté:</span>
                    <span className="text-clay-600">{formatAmount(c.collected_amount)}</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <Link href={`/campaigns/${c.slug}`} className="btn-ghost !p-2 text-xs" title="Voir">
                      <Eye size={16} />
                    </Link>

                    {c.status === "draft" && (
                      <button
                        onClick={() => handleSubmitCampaign(c.slug)}
                        className="btn-secondary !py-1.5 !px-3 text-xs"
                      >
                        <Send size={13} /> Soumettre
                      </button>
                    )}

                    {c.status === "pending_review" && isAdmin && (
                      <>
                        <button
                          onClick={() =>
                            setShowModerationModal({
                              type: "approve_campaign",
                              idOrSlug: c.slug,
                              title: c.title,
                            })
                          }
                          className="btn-primary !bg-forest-600 hover:!bg-forest-700 !py-1.5 !px-3 text-xs"
                        >
                          <CheckCircle2 size={13} /> Valider
                        </button>
                        <button
                          onClick={() =>
                            setShowModerationModal({
                              type: "reject_campaign",
                              idOrSlug: c.slug,
                              title: c.title,
                            })
                          }
                          className="btn-ghost text-clay-600 !py-1.5 !px-2 text-xs"
                        >
                          <XCircle size={13} /> Rejeter
                        </button>
                      </>
                    )}

                    {c.status === "active" && (
                      <>
                        {isNgo && (
                          <>
                            <button
                              onClick={() => setShowFieldUpdateModal(c.id)}
                              className="btn-ghost text-xs !py-1.5 !px-2"
                              title="Ajouter rapport de terrain"
                            >
                              <FileText size={14} /> + Terrain
                            </button>
                            <button
                              onClick={() => setShowFundReportModal(c.id)}
                              className="btn-ghost text-xs !py-1.5 !px-2"
                              title="Ajouter rapport d'utilisation"
                            >
                              <FileSpreadsheet size={14} /> + Emploi fonds
                            </button>
                          </>
                        )}
                        <button
                          onClick={() =>
                            setShowModerationModal({
                              type: "close_campaign",
                              idOrSlug: c.slug,
                              title: c.title,
                            })
                          }
                          className="btn-ghost text-ink-muted text-xs !py-1.5 !px-2"
                        >
                          Clôturer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DÉBLOCAGES */}
      {activeTab === "disbursements" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={disbursementFilter}
                onChange={(e) => setDisbursementFilter(e.target.value)}
                className="field !py-2 text-xs w-48"
              >
                <option value="all">Tous les déblocages</option>
                <option value="pending">En attente de validation</option>
                <option value="approved">Validés (Instruction bancaire)</option>
                <option value="paid">Payés</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>

            <button onClick={() => setShowNewDisbursementModal(true)} className="btn-primary text-xs">
              <Plus size={14} /> Nouvelle demande
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-100/70 text-ink-muted uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Appel & Bénéficiaire</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4">Mode</th>
                    <th className="p-4">Motif</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {filteredDisbursements.map((d) => (
                    <tr key={d.id} className="hover:bg-sand-50/50">
                      <td className="p-4">
                        <p className="font-semibold text-ink">{d.campaign_title}</p>
                        <p className="text-ink-soft text-[11px]">{d.beneficiary_name}</p>
                      </td>
                      <td className="p-4 font-bold text-ink">{formatAmount(d.amount, d.currency)}</td>
                      <td className="p-4 text-ink-soft">
                        {d.method === "conditional_check" ? "Chèque conditionné" : "Virement direct"}
                      </td>
                      <td className="p-4 text-ink-soft max-w-xs truncate">{d.purpose}</td>
                      <td className="p-4">
                        <span
                          className={`chip text-[10px] uppercase font-bold ${
                            d.status === "paid"
                              ? "!bg-forest-50 !text-forest-600"
                              : d.status === "approved"
                              ? "!bg-ochre-50 !text-ochre-600"
                              : d.status === "pending"
                              ? "!bg-clay-50 !text-clay-600"
                              : "!bg-ink/5 !text-ink-muted"
                          }`}
                        >
                          {d.status}
                        </span>
                        {d.bank_reference && (
                          <p className="text-[10px] text-ink-muted mt-0.5">Réf: {d.bank_reference}</p>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        {isAdmin && d.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                setShowModerationModal({
                                  type: "approve_disbursement",
                                  idOrSlug: d.id,
                                  title: `Déblocage pour ${d.beneficiary_name}`,
                                })
                              }
                              className="btn-primary !bg-forest-600 hover:!bg-forest-700 !py-1 !px-2 text-[11px]"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() =>
                                setShowModerationModal({
                                  type: "reject_disbursement",
                                  idOrSlug: d.id,
                                  title: `Déblocage pour ${d.beneficiary_name}`,
                                })
                              }
                              className="btn-ghost text-clay-600 !py-1 !px-2 text-[11px]"
                            >
                              Rejeter
                            </button>
                          </>
                        )}

                        {isAdmin && d.status === "approved" && (
                          <button
                            onClick={() =>
                              setShowModerationModal({
                                type: "pay_disbursement",
                                idOrSlug: d.id,
                                title: `Déblocage pour ${d.beneficiary_name}`,
                              })
                            }
                            className="btn-primary !py-1 !px-2 text-[11px]"
                          >
                            Marquer Payé
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ORGANISATIONS */}
      {activeTab === "organization" && (
        <div className="space-y-6">
          {!isAdmin && myOrganization && (
            <div className="card p-6 space-y-4 max-w-3xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="eyebrow">Mon organisation</span>
                  <h3 className="font-display text-xl font-semibold text-ink">{myOrganization.name}</h3>
                </div>
                <span className={`chip text-[10px] font-bold ${myOrganization.is_certified ? "!bg-forest-50 !text-forest-600" : "!bg-ochre-50 !text-ochre-600"}`}>
                  {myOrganization.certification_status}
                </span>
              </div>

              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!token) {
                    showToast("Authentification requise pour modifier l'organisation.", "error");
                    return;
                  }
                  const form = new FormData(e.currentTarget);
                  const payload = {
                    name: String(form.get("name") || ""),
                    city: String(form.get("city") || ""),
                    country: String(form.get("country") || ""),
                    contact_email: String(form.get("contact_email") || ""),
                    contact_phone: String(form.get("contact_phone") || ""),
                    website: String(form.get("website") || ""),
                    description: String(form.get("description") || ""),
                  };
                  const res = await updateMyOrganization(payload, token);
                  if (res.success) {
                    showToast("Organisation mise à jour.");
                    await loadDashboardData(token);
                  } else {
                    showToast(res.error || "Mise à jour impossible.", "error");
                  }
                }}
              >
                <div>
                  <label className="font-semibold text-ink-muted uppercase text-[10px]">Nom</label>
                  <input name="name" defaultValue={myOrganization.name} className="field mt-1" />
                </div>
                <div>
                  <label className="font-semibold text-ink-muted uppercase text-[10px]">Ville</label>
                  <input name="city" defaultValue={myOrganization.city || ""} className="field mt-1" />
                </div>
                <div>
                  <label className="font-semibold text-ink-muted uppercase text-[10px]">Pays</label>
                  <input name="country" defaultValue={myOrganization.country} className="field mt-1" />
                </div>
                <div>
                  <label className="font-semibold text-ink-muted uppercase text-[10px]">Email contact</label>
                  <input name="contact_email" defaultValue={myOrganization.contact_email || ""} className="field mt-1" />
                </div>
                <div>
                  <label className="font-semibold text-ink-muted uppercase text-[10px]">Téléphone</label>
                  <input name="contact_phone" defaultValue={myOrganization.contact_phone || ""} className="field mt-1" />
                </div>
                <div>
                  <label className="font-semibold text-ink-muted uppercase text-[10px]">Site web</label>
                  <input name="website" defaultValue={myOrganization.website || ""} className="field mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-ink-muted uppercase text-[10px]">Description</label>
                  <textarea name="description" defaultValue={myOrganization.description || ""} className="field mt-1 min-h-28" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" className="btn-primary text-xs">Enregistrer</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizationView.map((org) => (
              <div key={org.id} className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="chip uppercase font-bold text-[10px]">{org.type}</span>
                  <span
                    className={`chip text-[10px] font-bold ${
                      org.is_certified ? "!bg-forest-50 !text-forest-600" : "!bg-ochre-50 !text-ochre-600"
                    }`}
                  >
                    {org.certification_status}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">{org.name}</h3>
                  <p className="text-xs text-ink-soft">{org.city}, {org.country}</p>
                </div>

                <p className="text-xs text-ink-soft leading-relaxed">{org.description}</p>

                <div className="pt-3 border-t border-ink/5 space-y-1 text-xs text-ink-muted">
                  <p>Contact: {org.contact_email || "N/A"}</p>
                  <p>Téléphone: {org.contact_phone || "N/A"}</p>
                </div>

                {isAdmin && !org.is_certified && (
                  <button
                    onClick={() => handleCertifyOrg(org.id)}
                    className="btn-primary w-full text-xs"
                  >
                    <UserCheck size={14} /> Certifier l'organisation
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NOUVELLE CAMPAGNE */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <h3 className="font-display text-xl font-semibold text-ink">Créer un appel à l'aide</h3>
              <button onClick={() => setShowNewCampaignModal(false)} className="text-ink-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-ink-muted uppercase">Type d'appel</label>
                  <select
                    value={newCampaignForm.type}
                    onChange={(e) =>
                      setNewCampaignForm({ ...newCampaignForm, type: e.target.value as CampaignType })
                    }
                    className="field mt-1"
                  >
                    <option value="medical">Appel Médical (Hôpital)</option>
                    <option value="ngo_project">Projet ONG</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-ink-muted uppercase">Catégorie</label>
                  <select
                    value={newCampaignForm.category}
                    onChange={(e) =>
                      setNewCampaignForm({ ...newCampaignForm, category: e.target.value as CampaignCategory })
                    }
                    className="field mt-1"
                  >
                    <option value="health">Santé</option>
                    <option value="emergency">Urgence</option>
                    <option value="education">Éducation</option>
                    <option value="development">Développement</option>
                    <option value="social">Social</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink-muted uppercase">Titre de l'appel *</label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={newCampaignForm.title}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, title: e.target.value })}
                  placeholder="Ex : Intervention chirurgicale pour..."
                  className="field mt-1"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-ink-muted uppercase">Objectif financier (XAF) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={newCampaignForm.target_amount}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, target_amount: e.target.value })}
                    placeholder="3500000"
                    className="field mt-1"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink-muted uppercase">Pays d'intervention</label>
                  <select
                    value={newCampaignForm.country}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, country: e.target.value })}
                    className="field mt-1"
                  >
                    <option value="CM">Cameroun</option>
                    <option value="TG">Togo</option>
                    <option value="CI">Côte d'Ivoire</option>
                    <option value="SN">Sénégal</option>
                    <option value="BF">Burkina Faso</option>
                    <option value="ML">Mali</option>
                    <option value="BJ">Bénin</option>
                    <option value="CD">RD Congo</option>
                    <option value="NG">Nigeria</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink-muted uppercase">Date limite de collecte *</label>
                <input
                  type="date"
                  required
                  value={newCampaignForm.deadline}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, deadline: e.target.value })}
                  className="field mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-ink-muted uppercase">Résumé succinct</label>
                <input
                  type="text"
                  maxLength={300}
                  value={newCampaignForm.summary}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, summary: e.target.value })}
                  placeholder="Aperçu rapide affiché sur les cartes..."
                  className="field mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-ink-muted uppercase">Description détaillée *</label>
                <textarea
                  rows={3}
                  required
                  value={newCampaignForm.description}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, description: e.target.value })}
                  placeholder="Présentez le cas médical ou les objectifs du projet..."
                  className="field mt-1"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-ink-muted uppercase">Formulaire de décharge signé</label>
                  <input
                    type="text"
                    maxLength={512}
                    value={newCampaignForm.consent_form_path}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, consent_form_path: e.target.value })}
                    className="field mt-1"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink-muted uppercase">Devis / Chiffrage budgétaire</label>
                  <input
                    type="text"
                    maxLength={512}
                    value={newCampaignForm.budget_justification_path}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, budget_justification_path: e.target.value })}
                    className="field mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => setShowNewCampaignModal(false)}
                  className="btn-ghost"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingCampaign}
                  aria-busy={creatingCampaign}
                  className="btn-primary min-w-36 disabled:cursor-wait disabled:opacity-70"
                >
                  {creatingCampaign ? (
                    <>
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                      Création…
                    </>
                  ) : (
                    "Créer l'appel"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOUVEAU DÉBLOCAGE */}
      {showNewDisbursementModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <h3 className="font-display text-xl font-semibold text-ink">Demande de déblocage de fonds</h3>
              <button onClick={() => setShowNewDisbursementModal(false)} className="text-ink-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDisbursement} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink-muted uppercase">Sélectionner l'appel *</label>
                <select
                  required
                  value={newDisbursementForm.campaign}
                  onChange={(e) => setNewDisbursementForm({ ...newDisbursementForm, campaign: e.target.value })}
                  className="field mt-1"
                >
                  <option value="">-- Choisir une campagne --</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (Collecté: {formatAmount(c.collected_amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-ink-muted uppercase">Montant demandé (XAF) *</label>
                  <input
                    type="number"
                    required
                    value={newDisbursementForm.amount}
                    onChange={(e) => setNewDisbursementForm({ ...newDisbursementForm, amount: e.target.value })}
                    placeholder="1500000"
                    className="field mt-1"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink-muted uppercase">Mode de versement</label>
                  <select
                    value={newDisbursementForm.method}
                    onChange={(e) =>
                      setNewDisbursementForm({ ...newDisbursementForm, method: e.target.value as DisbursementMethod })
                    }
                    className="field mt-1"
                  >
                    <option value="direct_transfer">Virement direct</option>
                    <option value="conditional_check">Chèque conditionné</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink-muted uppercase">Bénéficiaire institutionnel *</label>
                <input
                  type="text"
                  required
                  value={newDisbursementForm.beneficiary_name}
                  onChange={(e) => setNewDisbursementForm({ ...newDisbursementForm, beneficiary_name: e.target.value })}
                  placeholder="Ex : Hôpital Central ou Nom Fournisseur"
                  className="field mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-ink-muted uppercase">Objet de la dépense *</label>
                <textarea
                  rows={2}
                  required
                  value={newDisbursementForm.purpose}
                  onChange={(e) => setNewDisbursementForm({ ...newDisbursementForm, purpose: e.target.value })}
                  placeholder="Ex : Achat d'équipements / Première tranche de travaux..."
                  className="field mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => setShowNewDisbursementModal(false)}
                  className="btn-ghost"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Transmettre la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODÉRATION / VALIDATION */}
      {showModerationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <h3 className="font-display text-lg font-semibold text-ink">
                {showModerationModal.title}
              </h3>
              <button onClick={() => setShowModerationModal(null)} className="text-ink-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleModerationSubmit} className="space-y-4 text-xs">
              {showModerationModal.type === "pay_disbursement" ? (
                <div>
                  <label className="font-semibold text-ink-muted uppercase">
                    Référence bancaire / N° de chèque *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankRefInput}
                    onChange={(e) => setBankRefInput(e.target.value)}
                    placeholder="Ex : VIR-99201-X"
                    className="field mt-1"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-semibold text-ink-muted uppercase">
                    {showModerationModal.type === "close_campaign"
                      ? "Motif de clôture *"
                      : "Notes de modération"}
                  </label>
                  <textarea
                    rows={3}
                    required={showModerationModal.type === "close_campaign"}
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                    placeholder="Commentaires internes..."
                    className="field mt-1"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => setShowModerationModal(null)}
                  className="btn-ghost"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RAPPORT DE TERRAIN */}
      {showFieldUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <h3 className="font-display text-lg font-semibold text-ink">Publier une mise à jour terrain</h3>
              <button onClick={() => setShowFieldUpdateModal(null)} className="text-ink-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFieldUpdate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink-muted uppercase">Titre de la mise à jour *</label>
                <input
                  type="text"
                  required
                  value={fieldUpdateForm.title}
                  onChange={(e) => setFieldUpdateForm({ ...fieldUpdateForm, title: e.target.value })}
                  placeholder="Ex: Fin des fondations"
                  className="field mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-ink-muted uppercase">Contenu de la mise à jour *</label>
                <textarea
                  rows={4}
                  required
                  value={fieldUpdateForm.content}
                  onChange={(e) => setFieldUpdateForm({ ...fieldUpdateForm, content: e.target.value })}
                  placeholder="Décrivez l'avancement..."
                  className="field mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-ink/5">
                <button type="button" onClick={() => setShowFieldUpdateModal(null)} className="btn-ghost">
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RAPPORT D'UTILISATION DES FONDS */}
      {showFundReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <h3 className="font-display text-lg font-semibold text-ink">Publier un rapport d'emploi des fonds</h3>
              <button onClick={() => setShowFundReportModal(null)} className="text-ink-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFundReport} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink-muted uppercase">Titre du rapport *</label>
                <input
                  type="text"
                  required
                  value={fundReportForm.title}
                  onChange={(e) => setFundReportForm({ ...fundReportForm, title: e.target.value })}
                  placeholder="Ex: Tranche 1 - Achats ciment"
                  className="field mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-ink-muted uppercase">Montant utilisé (XAF) *</label>
                <input
                  type="number"
                  required
                  value={fundReportForm.amount_used}
                  onChange={(e) => setFundReportForm({ ...fundReportForm, amount_used: e.target.value })}
                  placeholder="1800000"
                  className="field mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-ink-muted uppercase">Description des dépenses</label>
                <textarea
                  rows={3}
                  value={fundReportForm.description}
                  onChange={(e) => setFundReportForm({ ...fundReportForm, description: e.target.value })}
                  placeholder="Détail des achats..."
                  className="field mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-ink/5">
                <button type="button" onClick={() => setShowFundReportModal(null)} className="btn-ghost">
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Publier le rapport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
