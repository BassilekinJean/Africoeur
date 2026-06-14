export type CampaignType = "medical" | "ngo_project";
export type CampaignCategory =
  | "health"
  | "emergency"
  | "education"
  | "development"
  | "social";
export type CampaignStatus = "active" | "closed" | "funded";

export interface PatientPublic {
  display_name: string;
  age: number;
  is_minor: boolean;
  general_situation: string;
  display_level: 1 | 2 | 3;
  photo_path: string;
  video_path: string;
}

export interface FieldUpdate {
  id: string;
  title: string;
  content: string;
  media_paths: string[];
  created_at: string;
}

export interface FundUsageReport {
  id: string;
  title: string;
  description: string;
  amount_used: string;
  attachment_paths: string[];
  created_at: string;
}

export interface Campaign {
  id: string;
  type: CampaignType;
  category: CampaignCategory;
  title: string;
  slug: string;
  summary: string;
  country: string;
  target_amount: string;
  collected_amount: string;
  currency: string;
  donor_count: number;
  progress_pct: number;
  cover_image_path: string;
  status: CampaignStatus;
  deadline: string | null;
  organization_name: string;
  organization_type: string;
  published_at: string | null;
}

export interface CampaignDetail extends Campaign {
  description: string;
  video_path: string;
  patient: PatientPublic | null;
  field_updates: FieldUpdate[];
  fund_usage_reports: FundUsageReport[];
}

export interface DonationPublic {
  id: string;
  donor_name: string;
  amount: string;
  currency: string;
  message: string;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
