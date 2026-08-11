export type CampaignType = "medical" | "ngo_project";
export type CampaignCategory =
  | "health"
  | "emergency"
  | "education"
  | "development"
  | "social";
export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "closed"
  | "funded"
  | "rejected";

export type Role = "hospital_agent" | "ngo_agent" | "admin" | "donor";
export type DisbursementStatus = "pending" | "approved" | "paid" | "rejected";
export type DisbursementMethod = "conditional_check" | "direct_transfer";
export type CertificationStatus = "pending" | "certified" | "suspended" | "rejected";
export type OrganizationType = "hospital" | "ngo";

export interface UserProfile {
  id: string;
  supabase_user_id: string;
  email: string;
  full_name: string;
  role: Role;
  organization: string | null;
  organization_name: string | null;
  organization_type: OrganizationType | null;
  locale: string;
  is_active: boolean;
  created_at: string;
}

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
  campaign: string;
  title: string;
  content: string;
  media_paths: string[];
  created_at: string;
}

export interface FundUsageReport {
  id: string;
  campaign: string;
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
  consent_form_path?: string;
  budget_justification_path?: string;
  internal_notes?: string;
  moderation_notes?: string;
  patient: PatientPublic | null;
  field_updates: FieldUpdate[];
  fund_usage_reports: FundUsageReport[];
}

export interface CampaignWriteInput {
  type: CampaignType;
  category: CampaignCategory;
  title: string;
  summary: string;
  description: string;
  country: string;
  target_amount: string;
  currency?: string;
  cover_image_path?: string;
  video_path?: string;
  deadline?: string;
  budget_justification_path?: string;
  consent_form_path?: string;
  internal_notes?: string;
}

export interface DisbursementRequest {
  id: string;
  campaign: string;
  campaign_title: string;
  amount: string;
  currency: string;
  method: DisbursementMethod;
  beneficiary_name: string;
  purpose: string;
  justification_paths: string[];
  status: DisbursementStatus;
  admin_notes: string;
  bank_reference: string;
  reviewed_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface DisbursementCreateInput {
  campaign: string;
  amount: string;
  currency?: string;
  method?: DisbursementMethod;
  beneficiary_name: string;
  purpose: string;
  justification_paths?: string[];
}

export interface Organization {
  id: string;
  type: OrganizationType;
  name: string;
  legal_status?: string;
  registration_number?: string;
  country: string;
  city?: string;
  intervention_zones?: string[];
  action_domains?: string[];
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  logo_path?: string;
  certification_status: CertificationStatus;
  certified_at?: string;
  is_certified: boolean;
  is_premium?: boolean;
  created_at: string;
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

