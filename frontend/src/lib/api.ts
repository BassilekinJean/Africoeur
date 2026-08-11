import type {
  Campaign,
  CampaignDetail,
  CampaignWriteInput,
  DisbursementCreateInput,
  DisbursementRequest,
  DonationPublic,
  FieldUpdate,
  FundUsageReport,
  Organization,
  Paginated,
  UserProfile,
} from "@/types/api";
import { DEMO_CAMPAIGNS, DEMO_DISBURSEMENTS, DEMO_DONORS, DEMO_ORGANIZATIONS } from "./demo";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface CampaignQuery {
  type?: string;
  category?: string;
  country?: string;
  status?: string;
  search?: string;
}

async function safeFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function filterDemo(query: CampaignQuery): Campaign[] {
  return DEMO_CAMPAIGNS.filter((c) => {
    if (query.type && c.type !== query.type) return false;
    if (query.category && c.category !== query.category) return false;
    if (query.country && c.country !== query.country) return false;
    if (query.status && c.status !== query.status) return false;
    if (
      query.search &&
      !`${c.title} ${c.summary}`.toLowerCase().includes(query.search.toLowerCase())
    )
      return false;
    return true;
  });
}

// --- Public Endpoints ---
export async function getCampaigns(query: CampaignQuery = {}): Promise<Campaign[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => v && params.set(k, v));
  const data = await safeFetch<Paginated<Campaign>>(
    `/campaigns/?${params.toString()}`,
  );
  if (data) return data.results;
  return filterDemo(query);
}

export async function getCampaign(slug: string): Promise<CampaignDetail | null> {
  const data = await safeFetch<CampaignDetail>(`/campaigns/${slug}/`);
  if (data) return data;
  return DEMO_CAMPAIGNS.find((c) => c.slug === slug) ?? null;
}

export async function getDonors(campaignId: string): Promise<DonationPublic[]> {
  const data = await safeFetch<Paginated<DonationPublic>>(
    `/donations/?campaign=${campaignId}`,
  );
  if (data) return data.results;
  return DEMO_DONORS;
}

// --- Authenticated Profile ---
export async function getMe(token?: string): Promise<UserProfile | null> {
  if (!token) return null;
  const res = await safeFetch<UserProfile>("/me/", {
    headers: getAuthHeaders(token),
  });
  return res;
}

// --- Back-Office Campaigns ---
export async function getDashboardCampaigns(token?: string): Promise<CampaignDetail[]> {
  if (token) {
    const data = await safeFetch<Paginated<CampaignDetail>>("/campaigns/", {
      headers: getAuthHeaders(token),
    });
    if (data && data.results) return data.results;
  }
  return DEMO_CAMPAIGNS;
}

export async function createCampaign(
  payload: CampaignWriteInput,
  token?: string,
): Promise<{ success: boolean; data?: CampaignDetail; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/campaigns/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      } else {
        const err = await res.json();
        return { success: false, error: JSON.stringify(err) };
      }
    } catch (e: any) {
      // Fallback below
    }
  }
  // Local fallback for demo mode
  const newCamp: CampaignDetail = {
    id: `demo-${Date.now()}`,
    type: payload.type,
    category: payload.category,
    title: payload.title,
    slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    summary: payload.summary,
    description: payload.description,
    country: payload.country,
    target_amount: payload.target_amount,
    collected_amount: "0",
    currency: payload.currency || "XAF",
    donor_count: 0,
    progress_pct: 0,
    cover_image_path:
      payload.cover_image_path ||
      "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=70",
    video_path: payload.video_path || "",
    status: "draft",
    deadline: payload.deadline || null,
    organization_name: "Organisation démo",
    organization_type: payload.type === "medical" ? "hospital" : "ngo",
    published_at: null,
    budget_justification_path: payload.budget_justification_path || "",
    consent_form_path: payload.consent_form_path || "",
    internal_notes: payload.internal_notes || "",
    patient:
      payload.type === "medical"
        ? {
            display_name: "Patient",
            age: 10,
            is_minor: true,
            general_situation: payload.summary,
            display_level: 1,
            photo_path: "",
            video_path: "",
          }
        : null,
    field_updates: [],
    fund_usage_reports: [],
  };
  DEMO_CAMPAIGNS.unshift(newCamp);
  return { success: true, data: newCamp };
}

export async function submitCampaign(
  slug: string,
  token?: string,
): Promise<{ success: boolean; data?: CampaignDetail; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${slug}/submit/`, {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json();
      return { success: false, error: err.detail || JSON.stringify(err) };
    } catch (e: any) {}
  }
  const found = DEMO_CAMPAIGNS.find((c) => c.slug === slug);
  if (found) {
    found.status = "pending_review";
    return { success: true, data: found };
  }
  return { success: false, error: "Campagne introuvable." };
}

export async function approveCampaign(
  slug: string,
  notes?: string,
  token?: string,
): Promise<{ success: boolean; data?: CampaignDetail; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${slug}/approve/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ notes: notes || "" }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json();
      return { success: false, error: err.detail || JSON.stringify(err) };
    } catch (e: any) {}
  }
  const found = DEMO_CAMPAIGNS.find((c) => c.slug === slug);
  if (found) {
    found.status = "active";
    found.published_at = new Date().toISOString();
    found.moderation_notes = notes || "";
    return { success: true, data: found };
  }
  return { success: false, error: "Campagne introuvable." };
}

export async function rejectCampaign(
  slug: string,
  notes?: string,
  token?: string,
): Promise<{ success: boolean; data?: CampaignDetail; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${slug}/reject/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ notes: notes || "" }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json();
      return { success: false, error: err.detail || JSON.stringify(err) };
    } catch (e: any) {}
  }
  const found = DEMO_CAMPAIGNS.find((c) => c.slug === slug);
  if (found) {
    found.status = "rejected";
    found.moderation_notes = notes || "";
    return { success: true, data: found };
  }
  return { success: false, error: "Campagne introuvable." };
}

export async function closeCampaign(
  slug: string,
  reason: string,
  token?: string,
): Promise<{ success: boolean; data?: CampaignDetail; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${slug}/close/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json();
      return { success: false, error: err.detail || JSON.stringify(err) };
    } catch (e: any) {}
  }
  const found = DEMO_CAMPAIGNS.find((c) => c.slug === slug);
  if (found) {
    found.status = "closed";
    return { success: true, data: found };
  }
  return { success: false, error: "Campagne introuvable." };
}

// --- Field Updates & Fund Usage Reports ---
export async function createFieldUpdate(
  payload: { campaign: string; title: string; content: string; media_paths?: string[] },
  token?: string,
): Promise<{ success: boolean; data?: FieldUpdate; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/field-updates/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {}
  }
  const update: FieldUpdate = {
    id: `fu-${Date.now()}`,
    campaign: payload.campaign,
    title: payload.title,
    content: payload.content,
    media_paths: payload.media_paths || [],
    created_at: new Date().toISOString(),
  };
  const camp = DEMO_CAMPAIGNS.find((c) => c.id === payload.campaign);
  if (camp) {
    camp.field_updates.unshift(update);
  }
  return { success: true, data: update };
}

export async function createFundUsageReport(
  payload: {
    campaign: string;
    title: string;
    description: string;
    amount_used: string;
    attachment_paths?: string[];
  },
  token?: string,
): Promise<{ success: boolean; data?: FundUsageReport; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/fund-usage-reports/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {}
  }
  const report: FundUsageReport = {
    id: `fr-${Date.now()}`,
    campaign: payload.campaign,
    title: payload.title,
    description: payload.description,
    amount_used: payload.amount_used,
    attachment_paths: payload.attachment_paths || [],
    created_at: new Date().toISOString(),
  };
  const camp = DEMO_CAMPAIGNS.find((c) => c.id === payload.campaign);
  if (camp) {
    camp.fund_usage_reports.unshift(report);
  }
  return { success: true, data: report };
}

// --- Disbursements ---
export async function getDisbursements(token?: string): Promise<DisbursementRequest[]> {
  if (token) {
    const data = await safeFetch<Paginated<DisbursementRequest>>("/disbursements/", {
      headers: getAuthHeaders(token),
    });
    if (data && data.results) return data.results;
  }
  return DEMO_DISBURSEMENTS;
}

export async function createDisbursement(
  payload: DisbursementCreateInput,
  token?: string,
): Promise<{ success: boolean; data?: DisbursementRequest; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/disbursements/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json();
      return { success: false, error: JSON.stringify(err) };
    } catch (e) {}
  }
  const camp = DEMO_CAMPAIGNS.find((c) => c.id === payload.campaign);
  const newDisb: DisbursementRequest = {
    id: `disb-${Date.now()}`,
    campaign: payload.campaign,
    campaign_title: camp ? camp.title : "Appel sélectionné",
    amount: payload.amount,
    currency: payload.currency || "XAF",
    method: payload.method || "direct_transfer",
    beneficiary_name: payload.beneficiary_name,
    purpose: payload.purpose,
    justification_paths: payload.justification_paths || [],
    status: "pending",
    admin_notes: "",
    bank_reference: "",
    reviewed_at: null,
    paid_at: null,
    created_at: new Date().toISOString(),
  };
  DEMO_DISBURSEMENTS.unshift(newDisb);
  return { success: true, data: newDisb };
}

export async function approveDisbursement(
  id: string,
  notes?: string,
  token?: string,
): Promise<{ success: boolean; data?: DisbursementRequest; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/disbursements/${id}/approve/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ notes: notes || "" }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {}
  }
  const item = DEMO_DISBURSEMENTS.find((d) => d.id === id);
  if (item) {
    item.status = "approved";
    item.admin_notes = notes || "";
    item.reviewed_at = new Date().toISOString();
    return { success: true, data: item };
  }
  return { success: false, error: "Demande introuvable." };
}

export async function rejectDisbursement(
  id: string,
  notes?: string,
  token?: string,
): Promise<{ success: boolean; data?: DisbursementRequest; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/disbursements/${id}/reject/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ notes: notes || "" }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {}
  }
  const item = DEMO_DISBURSEMENTS.find((d) => d.id === id);
  if (item) {
    item.status = "rejected";
    item.admin_notes = notes || "";
    item.reviewed_at = new Date().toISOString();
    return { success: true, data: item };
  }
  return { success: false, error: "Demande introuvable." };
}

export async function markDisbursementPaid(
  id: string,
  bankReference: string,
  token?: string,
): Promise<{ success: boolean; data?: DisbursementRequest; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/disbursements/${id}/mark_paid/`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ bank_reference: bankReference }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {}
  }
  const item = DEMO_DISBURSEMENTS.find((d) => d.id === id);
  if (item) {
    item.status = "paid";
    item.bank_reference = bankReference;
    item.paid_at = new Date().toISOString();
    return { success: true, data: item };
  }
  return { success: false, error: "Demande introuvable." };
}

// --- Organizations ---
export async function getOrganizations(token?: string): Promise<Organization[]> {
  if (token) {
    const data = await safeFetch<Paginated<Organization>>("/organizations/", {
      headers: getAuthHeaders(token),
    });
    if (data && data.results) return data.results;
  }
  return DEMO_ORGANIZATIONS;
}

export async function getMyOrganization(token?: string): Promise<Organization | null> {
  if (!token) return null;
  const data = await safeFetch<Organization>("/organizations/me/", {
    headers: getAuthHeaders(token),
  });
  return data;
}

export async function updateMyOrganization(
  payload: Partial<Organization>,
  token?: string,
): Promise<{ success: boolean; data?: Organization; error?: string }> {
  if (!token) {
    return { success: false, error: "Authentification requise." };
  }
  try {
    const res = await fetch(`${API_BASE}/organizations/me/`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }
    const err = await res.json();
    return { success: false, error: err.detail || JSON.stringify(err) };
  } catch {
    return { success: false, error: "Impossible de mettre à jour l'organisation." };
  }
}

export async function certifyOrganization(
  id: string,
  token?: string,
): Promise<{ success: boolean; data?: Organization; error?: string }> {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/organizations/${id}/certify/`, {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {}
  }
  const org = DEMO_ORGANIZATIONS.find((o) => o.id === id);
  if (org) {
    org.certification_status = "certified";
    org.is_certified = true;
    org.certified_at = new Date().toISOString();
    return { success: true, data: org };
  }
  return { success: false, error: "Organisation introuvable." };
}

export { API_BASE };

