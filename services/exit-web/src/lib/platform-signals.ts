// ── LAYER 8 · PROPRIETARY PLATFORM SIGNALS ─────────────────────────
// The moat layer: behavioural evidence no external database has, computed
// from this workspace's OWN process records — the NDAs issued through the
// protocol and the offers received on the live deal. Public history says
// what a buyer did in the market; these signals say how counterparties
// behave inside an ExitOS process: do they sign, how fast, do they bid.
// Every figure carries its sample size — small-n is shown, not hidden.

import { evaluateNdaStatus } from "@exit/engines";
import { SAMPLE_NDAS, SAMPLE_OFFERS, OFFER_COMPARISON } from "./engines.js";

export interface PlatformSignal {
  readonly label: string;
  readonly value: string;
  readonly sample: string;       // "n=6 NDAs" — honest basis
  readonly detail: string;
}

const DAY = 86_400_000;

function median(xs: number[]): number | undefined {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function computePlatformSignals(): readonly PlatformSignal[] {
  const ndas = SAMPLE_NDAS;
  const statuses = ndas.map((n) => evaluateNdaStatus(n));
  const executed = ndas.filter((_, i) => statuses[i] === "active" || statuses[i] === "expired");

  // NDA conversion — issued → executed
  const conversion = ndas.length ? executed.length / ndas.length : 0;

  // Responsiveness — issued → executed, in days, where both stamps exist
  const signDays = ndas
    .map((n) => (n.executedAt ? (new Date(n.executedAt).getTime() - new Date(n.issuedAt).getTime()) / DAY : undefined))
    .filter((d): d is number => d != null && d >= 0);
  const medSign = median(signDays);

  // Offer behaviour on the live process
  const offers = SAMPLE_OFFERS;
  const countered = offers.filter((o) => o.stage === "countered").length;
  const leader = OFFER_COMPARISON.offers[0];

  return [
    {
      label: "NDA conversion",
      value: `${Math.round(conversion * 100)}%`,
      sample: `n=${ndas.length} NDAs`,
      detail: `${executed.length} of ${ndas.length} issued NDAs reached execution through the protocol`,
    },
    {
      label: "Median time to signature",
      value: medSign != null ? `${medSign.toFixed(1)}d` : "—",
      sample: `n=${signDays.length} signed`,
      detail: "issued → countersigned, both timestamps on the record",
    },
    {
      label: "NDA → offer conversion",
      value: ndas.length ? `${Math.round((offers.length / ndas.length) * 100)}%` : "—",
      sample: `n=${offers.length} offers`,
      detail: `${offers.length} offers in hand against ${ndas.length} NDAs issued on the listing`,
    },
    {
      label: "Offers in negotiation",
      value: `${countered}/${offers.length}`,
      sample: `n=${offers.length} offers`,
      detail: countered > 0 ? "counterparties engaging on counters — live tension" : "no counters in flight yet",
    },
    {
      label: "Leading counterparty",
      value: leader ? `${leader.score.toFixed(0)}/100` : "—",
      sample: "desk score",
      detail: leader ? `${leader.offer.buyerName} leads the field on structure-weighted score` : "no offers scored",
    },
  ];
}
