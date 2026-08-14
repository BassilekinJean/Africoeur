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

function formatApiError(error: unknown): string {
  if (!error) {
    return "La demande n’a pas pu être créée. Vérifiez les informations saisies.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error)) {
    return error.map((item) => formatApiError(item)).join(" ");
  }

  if (typeof error === "object") {
    const fieldLabels: Record<string, string> = {
      campaign: "la campagne",
      deadline: "la date limite",
      type: "le type d’appel",
      category: "la catégorie",
      title: "le titre",
      summary: "le résumé",
      description: "la description",
      country: "le pays",
      target_amount: "le montant cible",
      currency: "la devise",
      cover_image_path: "l’image de couverture",
      video_path: "la vidéo",
      budget_justification_path: "le justificatif budgétaire",
      consent_form_path: "le formulaire de décharge",
      internal_notes: "les notes internes",
      amount: "le montant demandé",
      beneficiary_name: "le bénéficiaire",
      purpose: "l’objet de la dépense",
      method: "le mode de versement",
      justification_paths: "les justificatifs",
      non_field_errors: "La demande",
      detail: "La demande",
    };

    const messages: string[] = [];

    for (const [key, value] of Object.entries(error as Record<string, unknown>)) {
      const label = fieldLabels[key] ?? key;
      const message = Array.isArray(value)
        ? value.map((item) => formatApiError(item)).join(" ")
        : typeof value === "string"
          ? value
          : JSON.stringify(value);

      if (message) {
        const normalized = message.replace(/\[|\]|"/g, "").trim();
        const alreadyNamesField = normalized
          .toLocaleLowerCase("fr")
          .includes(label.toLocaleLowerCase("fr"));
        messages.push(alreadyNamesField ? normalized : `${label} : ${normalized}`);
      }
    }

    if (messages.length) return messages.join(" ");
    return JSON.stringify(error);
  }

  return "La demande n’a pas pu être créée. Vérifiez les informations saisies.";
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
        const err = await res.json().catch(() => null);
        return { success: false, error: formatApiError(err) };
      }
    } catch (e: any) {
      // Fallback below
    }
  }
  return { success: false, error: "Création impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Soumission impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Validation impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Rejet impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Clôture impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Publication impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Publication impossible sans authentification ou API disponible." };
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
      const err = await res.json().catch(() => null);
      return { success: false, error: formatApiError(err) };
    } catch (e) {}
  }
  return { success: false, error: "Demande de déblocage impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Validation impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Rejet impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Marquage payé impossible sans authentification ou API disponible." };
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
  return { success: false, error: "Certification impossible sans authentification ou API disponible." };
}

export { API_BASE };
