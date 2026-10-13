// The module catalogue shown on Modules and summarised on the homepage. The
// stats come from the live engines (see ./module-stats), never typed in by hand.

import { MODULE_FACTS } from "./module-stats";

export interface Mod { icon: string; name: string; body: string; stat?: string }

export const FOUNDER_MODULES: Mod[] = [
  { icon: "chart", name: "Valuation Engine", body: "DCF, comparables and revenue/EBITDA multiples, recomputed from your figures.", stat: MODULE_FACTS.valuation },
  { icon: "spark", name: "Exit Readiness Score", body: "A money-tied score across weighted dimensions with each fix priced.", stat: MODULE_FACTS.readiness },
  { icon: "globe", name: "Buyer Intelligence", body: "Likelihood, range, timing, risk and synergy for every acquirer.", stat: MODULE_FACTS.buyerIntel },
  { icon: "users", name: "Outreach", body: "Teasers, CIMs and a sequenced campaign — drafted by the banker for you to send.", stat: MODULE_FACTS.outreach },
  { icon: "lock", name: "Data Room", body: "A document checklist, completeness-scored, with the dollar impact of every gap.", stat: MODULE_FACTS.dataRoom },
  { icon: "doc", name: "Documents", body: "CIM, teaser, deck outline and data-room index, checked against your own figures.", stat: MODULE_FACTS.documents },
  { icon: "chart", name: "Negotiator", body: "Offer scoring, counters, protective clauses and earnout alternatives." },
  { icon: "check", name: "Closing Center", body: "The closing checklist: signatures, escrow and filings, item by item." },
  { icon: "shield", name: "WealthOS", body: "Proceeds, taxes, trusts, family office and reinvestment after close." },
];

export const BUYER_MODULES: Mod[] = [
  { icon: "globe", name: "Marketplace", body: "Browse anonymized opportunities matched to your thesis.", stat: MODULE_FACTS.marketplace },
  { icon: "chart", name: "Acquisition Radar", body: "Sector signals from the registry — deals, mandates and demand.", stat: MODULE_FACTS.radar },
  { icon: "lock", name: "Deal Room", body: "Diligence access for companies that accept your NDA request." },
  { icon: "doc", name: "Access Requests", body: "Request NDA-gated identity and packages, tracked end to end." },
];

