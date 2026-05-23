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
  ai_brand_profile: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
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
}
