// ── PLAIN-LANGUAGE TERMS ────────────────────────────────────────────
// One-sentence meanings for the deal and finance terms the console uses.
// Shown in the "Plain-language terms" panel; page text is not rewritten.

export interface Term { term: string; aka?: string; meaning: string }

export const GLOSSARY: readonly Term[] = [
  { term: "ARR", aka: "Annual recurring revenue", meaning: "Subscription revenue the company would bill over the next 12 months at today's rate." },
  { term: "Canonical value", aka: "Canonical midpoint", meaning: "The one company value every console page uses: the midpoint of the institutional valuation framework." },
  { term: "Cap table", meaning: "The list of who owns shares in the company, and how many." },
  { term: "CIM", aka: "Confidential information memorandum", meaning: "The detailed document about the company that buyers receive after signing an NDA." },
  { term: "Data room", meaning: "A shared folder where the company gives buyers documents during diligence. The Data Room page says who can see uploads in ExitOS." },
  { term: "Demo data", meaning: "Sample figures for a made-up company, shown until you enter your own in Value My Company." },
  { term: "Diligence", aka: "Due diligence", meaning: "The buyer's checks of the company's finances, contracts, legal position and technology before signing." },
  { term: "Earn-out", meaning: "Part of the price paid later, and only if the business reaches agreed targets after the sale." },
  { term: "EBITDA", meaning: "Earnings before interest, tax, depreciation and amortisation: a rough measure of operating profit. The EBITDA margin is EBITDA as a share of revenue." },
  { term: "Enterprise value", aka: "EV", meaning: "What the whole business is worth to a buyer, before debt is paid off and cash is added." },
  { term: "Escrow", meaning: "Part of the price held by a neutral third party for a time after closing, to cover claims." },
  { term: "Financial buyer", meaning: "An investor, such as a private-equity fund, that buys companies as investments." },
  { term: "IOI", aka: "Indication of interest", meaning: "An early, non-binding price range from a buyer." },
  { term: "LOI", aka: "Letter of intent", meaning: "A buyer's written offer setting the main terms. Mostly non-binding, and often asks for a period of exclusivity." },
  { term: "Mandate", meaning: "For a founder: the engagement to run a sale (the Active Mandate plan). For a buyer: the kind of companies they want to buy." },
  { term: "Multiple", meaning: "A value divided by a financial figure. For example, 6× ARR means a value six times the ARR." },
  { term: "NDA", aka: "Non-disclosure agreement", meaning: "The buyer's promise to keep the information it receives confidential." },
  { term: "Premium", aka: "Strategic premium", meaning: "The amount above the financial value that a buyer may pay because the company fits its business." },
  { term: "Prior", meaning: "A labelled neutral assumption used where a figure was not disclosed." },
  { term: "Provenance", meaning: "Where a figure comes from, shown as a small badge next to it: verified record, registry, model, prior, your intake, demo data or snapshot." },
  { term: "Registry", aka: "Snapshot", meaning: "ExitOS's index of past acquisitions and acquirers, bundled with the app as of a date. It is not a live feed." },
  { term: "Strategic buyer", meaning: "A company in the same or a related industry that buys to grow its own business." },
  { term: "Success fee", meaning: "A fee paid only when the sale closes. On the Active Mandate it is 2.5%." },
  { term: "Teaser", meaning: "A short, anonymous summary of the company sent to buyers before an NDA." },
  { term: "TTM", aka: "Trailing twelve months", meaning: "The last 12 months of actual results." },
];

export function searchGlossary(q: string): readonly Term[] {
  const s = q.trim().toLowerCase();
  if (!s) return GLOSSARY;
  return GLOSSARY.filter((t) => `${t.term} ${t.aka ?? ""} ${t.meaning}`.toLowerCase().includes(s));
}
