import type {
  Campaign,
  CampaignDetail,
  DonationPublic,
  Paginated,
} from "@/types/api";
import { DEMO_CAMPAIGNS, DEMO_DONORS } from "./demo";

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
      next: { revalidate: 60 },
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // L'API Django n'est pas joignable : on repliera sur les données de démo.
    return null;
  }
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

export { API_BASE };
