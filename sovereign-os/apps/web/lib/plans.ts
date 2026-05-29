// Plan catalogue for Emergency AI — shared between marketing pricing page
// and the in-console billing view. STRIPE_PRICE_* fall back to placeholders
// until the operator wires real Stripe price ids via env.

export type PlanId = 'evaluator' | 'operator' | 'institutional';

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;       // USD
  monthlyJobQuota: number | null;  // null = unlimited
  highlight?: string;
  priceIdEnv: string;         // env var that holds the Stripe price id
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'evaluator',
    name: 'Evaluator',
    tagline: 'Explore the platform — a working sandbox for solo operators.',
    monthlyPrice: 0,
    monthlyJobQuota: 5,
    priceIdEnv: 'NEXT_PUBLIC_STRIPE_PRICE_EVALUATOR',
    features: [
      'Up to 5 production jobs / month',
      'Single seat',
      'Watermarked exports',
      'Community support',
    ],
  },
  {
    id: 'operator',
    name: 'Operator',
    tagline: 'For teams running real campaigns through the sovereign layer.',
    monthlyPrice: 490,
    monthlyJobQuota: null,
    highlight: 'Most teams start here',
    priceIdEnv: 'NEXT_PUBLIC_STRIPE_PRICE_OPERATOR',
    features: [
      'Unlimited production jobs',
      '5 operator seats',
      'Full HD cinematic exports',
      'Channel distribution (LinkedIn, YouTube, X)',
      'Priority compute queue',
      'Email support · 24h response',
    ],
  },
  {
    id: 'institutional',
    name: 'Institutional',
    tagline: 'Sovereign-grade deployment for institutions and agencies.',
    monthlyPrice: 4900,
    monthlyJobQuota: null,
    priceIdEnv: 'NEXT_PUBLIC_STRIPE_PRICE_INSTITUTIONAL',
    features: [
      'Everything in Operator',
      'Unlimited seats',
      'Dedicated compute capacity',
      'Custom voice cloning + brand intelligence',
      'Single-tenant isolation available',
      'Named success lead · 1h response · onboarding',
    ],
  },
];

export const planById = (id: string): Plan | undefined => PLANS.find((p) => p.id === id);
