import type { Billing, PlanTier } from "./api";

// The paid plans as the pricing page names and prices them (lib/messages/pricing.ts). Institutional and
// Institutional Plus are self-serve; Enterprise and Sovereign are scoped with the institution, so the
// console only ever requests them. Which plan is active is the server's record, never this list's.
export interface PlanInfo { readonly tier: PlanTier; readonly name: string; readonly price: string; readonly summary: string; readonly selfServe: boolean }

export const PLANS: readonly PlanInfo[] = [
  { tier: "institutional", name: "Institutional", price: "US$299 / month", summary: "One institution with production governance · 500 governed publications a month · SSO-ready", selfServe: true },
  { tier: "institutional_plus", name: "Institutional Plus", price: "US$999 / month", summary: "Multiple departments · unlimited governed publications · advanced policies · analytics", selfServe: true },
  { tier: "enterprise", name: "Enterprise", price: "From US$3,500 / month", summary: "Your identity provider, audit exports, high availability and an SLA — scoped with you", selfServe: false },
  { tier: "sovereign", name: "Sovereign", price: "Custom engagement", summary: "The whole platform under your jurisdiction: sovereign, air-gapped or on-premises", selfServe: false },
];

export const planInfo = (tier?: PlanTier | null): PlanInfo | undefined => PLANS.find((p) => p.tier === tier);

/** The plan's name for display: the active paid plan, or the Evaluation. */
export const planName = (b: Pick<Billing, "canDownload" | "tier">): string => (b.canDownload ? planInfo(b.tier)?.name ?? "Paid plan" : "Evaluation");

/** The Evaluation's standing in words: records and days left, or which limit ended it. */
export function evaluationStatus(b: Billing): { text: string; ended: boolean } {
  const records = Math.max(0, b.documentQuota - b.documentsUsed);
  if (b.trialEnded) return { text: "The 30-day evaluation has ended", ended: true };
  if (records === 0) return { text: `All ${b.documentQuota} evaluation records used`, ended: true };
  const days = b.trialDaysLeft;
  const r = `${records} record${records === 1 ? "" : "s"}`;
  return { text: days == null ? `${r} left` : `${days} day${days === 1 ? "" : "s"} and ${r} left`, ended: false };
}
