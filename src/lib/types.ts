export interface Domain {
  id: string;
  domain_name: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  hero_image_url?: string;
  price_usd: number;
  currency: string;
  status: string;
  category?: string;
  tld?: string;
  is_premium: boolean;
  is_featured: boolean;
  brand_color: string;
  accent_color: string;
  whatsapp_number?: string;
  contact_email?: string;
  view_count: number;
  inquiry_count: number;
  valuation_score: number;
  ssl_verified: boolean;
  ownership_verified: boolean;
  ai_brand_profile: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Lead {
  id: string;
  domain_id: string;
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  offer_amount?: number;
  intent: string;
  source: string;
  status: string;
  buyer_score: number;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  domain_id: string | null;
  event_type: string;
  session_id?: string | null;
  visitor_id?: string | null;
  device?: string | null;
  browser?: string | null;
  referrer?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  email: string | null;
  role: string;
  full_name: string | null;
  created_at: string;
}

export interface EcosystemProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string | null;
  capabilities: string[];
  status: string;
  accent: string;
  source_project_ref: string | null;
  is_featured: boolean;
  sort_order: number;
  url?: string | null;
  metrics?: Array<{ label: string; value: string }>;
  tiers?: Array<{ tier: string; price: string; label?: string; scope?: string; timeline?: string }>;
  image_url?: string | null;
}

export interface BrandPalette {
  primary: string;
  accent: string;
  neutral: string;
}

export interface MonetizationModel {
  model: string;
  description: string;
}

export interface LandingCopy {
  headline: string;
  subhead: string;
  cta: string;
}

export interface ValuationReport {
  overall_score: number;
  brand_strength: number;
  memorability: number;
  seo_potential: number;
  ai_relevance: number;
  market_alignment: number;
  startup_viability: number;
  sovereign_potential: number;
  estimated_value_low: number;
  estimated_value_high: number;
  industry_category: string;
  narrative: string;
  slogan: string;
  startup_concepts: Array<{ title: string; description: string; category: string }>;
  confidence_score: number;
  keywords?: string[];
  tld_strength?: number;
  length_score?: number;
  model_used?: string;
  // Phase 2 — intelligence + brand package
  market_trend_alignment?: number;
  enterprise_suitability?: number;
  brand_tone?: string;
  typography_direction?: string;
  ui_style?: string;
  logo_concept?: string;
  brand_palette?: BrandPalette;
  monetization?: MonetizationModel[];
  market_positioning?: string;
  investor_narrative?: string;
  elevator_pitch?: string;
  landing_copy?: LandingCopy;
}

export interface NegotiationMessage {
  role: 'buyer' | 'broker';
  text: string;
  offer?: number | null;
  ts: string;
}

export interface BrokerResponse {
  broker_message: string;
  counter_offer: number;
  stage: string;
  status: 'active' | 'accepted' | 'escalated';
  accepted: boolean;
  escalate: boolean;
  buyer_score: number;
  urgency_score: number;
  confidence: number;
  model_used?: string;
}

export interface BrandProfile {
  id: string;
  domain_id: string | null;
  domain_name: string;
  overall_score: number | null;
  slogan: string | null;
  brand_tone: string | null;
  typography_direction: string | null;
  ui_style: string | null;
  logo_concept: string | null;
  market_positioning: string | null;
  elevator_pitch: string | null;
  investor_narrative: string | null;
  primary_color: string | null;
  accent_color: string | null;
  neutral_color: string | null;
  monetization: MonetizationModel[];
  startup_concepts: Array<{ title: string; description: string; category: string }>;
  landing_copy: LandingCopy | Record<string, never>;
  industry_category: string | null;
  model_used: string | null;
  saved_by: string | null;
  created_at: string;
}
