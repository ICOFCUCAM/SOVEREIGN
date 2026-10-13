import type { Plan } from "./access";

// Buyer pricing — one source for the public Pricing page and the console's
// Upgrade page (HOMEPAGE.md CC1). Each tier maps to the plan key that actually
// gates the product: `free` browses the exchange; `pro` unlocks the buyer Deal
// Room and NDA access requests. Premium is a human-run introductions service,
// admitted by request — there is no session plan behind it, so no switch.
// Features list only what the product (or the service) does today.

export interface BuyerTier {
  readonly key: "buyer-free" | "buyer-basic" | "buyer-premium";
  readonly name: string;
  readonly price: string;
  readonly priceSub: string;
  readonly purpose: string;
  readonly headline: string;
  readonly features: readonly string[];
  /** The plan key that grants it in the console; null = admitted by request. */
  readonly plan: Plan | null;
}

export const BUYER_TIERS: readonly BuyerTier[] = [
  {
    key: "buyer-free", name: "Buyer Observer", price: "$0", priceSub: "to browse", plan: "free",
    purpose: "Browse the exchange",
    headline: "Browse anonymized opportunities. Upgrade to engage.",
    features: ["Browse anonymized opportunities", "Research acquirers", "Acquisition radar (view)", "Sign an NDA a seller issues to you and complete any transaction you are party to, free", "No NDA requests of your own or deal-room access"],
  },
  {
    key: "buyer-basic", name: "Buyer Access", price: "$299", priceSub: "/ month", plan: "pro",
    purpose: "Engage on diligence",
    headline: "Request NDA-gated diligence and work in the deal room.",
    features: ["Everything in Buyer Observer", "Request an NDA to unlock identity & packages", "Track your access requests", "Open the deal room for accepted NDAs"],
  },
  {
    key: "buyer-premium", name: "Premium Buyer Access", price: "$2,499", priceSub: "/ month · by request", plan: null,
    purpose: "First look + outbound",
    headline: "Active acquirer tier. Matched introductions before public listing — admitted by request.",
    features: ["Everything in Buyer Access", "Matched introductions before public listing", "A dedicated buyer-relationship lead"],
  },
];
