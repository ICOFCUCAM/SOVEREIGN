import type { Listing } from "./listings";

// ── SOCIAL POST COMPOSER + SHARE INTENTS ────────────────────────────
// Composes an anonymised, compliance-safe post from a listing (never the
// company identity for founder listings; product name only for the admin-owned
// Sovereign catalog, which is intentionally public), and builds official
// per-network share-composer URLs. Actual fan-out posting is handled by the
// ExitOS distribution engine (lib/distribution-engine.ts).

export type SocialChannel = "linkedin" | "x" | "facebook" | "instagram" | "telegram" | "whatsapp";

export interface ChannelMeta { id: SocialChannel; label: string; hasWebIntent: boolean }
export const CHANNELS: readonly ChannelMeta[] = [
  { id: "linkedin", label: "LinkedIn", hasWebIntent: true },
  { id: "x", label: "X (Twitter)", hasWebIntent: true },
  { id: "facebook", label: "Facebook", hasWebIntent: true },
  { id: "instagram", label: "Instagram", hasWebIntent: false }, // no web prefill — aggregator/copy only
  { id: "telegram", label: "Telegram", hasWebIntent: true },
  { id: "whatsapp", label: "WhatsApp", hasWebIntent: true },
];

export interface SocialPost {
  readonly title: string;
  readonly body: string;
  readonly hashtags: readonly string[];
  readonly url: string;
  /** the full composed text (body + hashtags), ready to post */
  readonly text: string;
}

const SECTOR_TAG: Record<string, string> = {
  logistics_freight: "Logistics", ai_infra: "AI", enterprise_saas: "SaaS", vertical_saas: "SaaS",
  fintech_payments: "Fintech", b2b_marketplace: "Marketplace", consumer_marketplace: "Marketplace",
  mobility: "Mobility", developer_tools: "DevTools", media_content: "Media",
};

function compose(title: string, lines: string[], hashtags: string[], url: string): SocialPost {
  const body = lines.filter(Boolean).join("\n");
  const text = `${body}\n\n${url}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`.trim();
  return { title, body, hashtags, url, text };
}

/** Build an anonymised, compliance-safe post from a listing. */
export function buildListingPost(l: Listing, origin = typeof window !== "undefined" ? window.location.origin : "https://exit.sovereigndo.com"): SocialPost {
  const url = `${origin}/console/acquisition-radar`;
  const baseTags = ["MnA", "Acquisition", "ExitOS"];
  const sectorTag = SECTOR_TAG[String(l.publicView.sector)] ?? "";
  const tags = sectorTag ? [...baseTags, sectorTag] : baseTags;

  if (l.productMeta) {
    // admin-owned catalog product — the product line is intentionally public
    const pm = l.productMeta;
    const value = pm.valueText ? `${pm.valueLabel ?? "Value"}: ${pm.valueText}` : "Value on request";
    const ack = pm.acquisitionReadyText ? `★ Acquisition-ready · ${pm.acquisitionReadyText}` : "";
    const coverage = pm.coverage && pm.coverage.length ? `Coverage: ${pm.coverage.slice(0, 5).join(" · ")}` : "";
    return compose(
      pm.productLine,
      [`🟢 Acquisition opportunity on the ExitOS Acquisition Exchange`, ``, `${pm.productLine} — ${pm.descriptor ?? pm.category}`, pm.capability, value, ack, coverage].filter(Boolean) as string[],
      tags, url,
    );
  }

  // founder listing — anonymised: code name only, never the company identity
  const fin = l.publicView.disclosed === false
    ? "Financials under NDA"
    : `Revenue ${usdShort(l.publicView.revenueUsd)} · Growth ${Math.round(l.publicView.growthPct * 100)}%`;
  return compose(
    l.code,
    [`🟢 New on the ExitOS Acquisition Exchange`, ``, `${l.code} — ${l.publicView.sector} · ${l.publicView.region}`, fin, `Qualified buyers can request an NDA to engage.`],
    tags, url,
  );
}

function usdShort(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${Math.round(n / 1e6)}M`;
  return `$${n.toLocaleString()}`;
}

// ── Official per-network share intents (real, client-side) ──────────
export function intentUrl(channel: SocialChannel, post: SocialPost): string | null {
  const u = encodeURIComponent(post.url);
  const t = encodeURIComponent(post.text);
  const tNoUrl = encodeURIComponent(`${post.body}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`);
  switch (channel) {
    case "x":        return `https://twitter.com/intent/tweet?text=${tNoUrl}&url=${u}`;
    case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${tNoUrl}`;
    case "linkedin": return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "telegram": return `https://t.me/share/url?url=${u}&text=${tNoUrl}`;
    case "whatsapp": return `https://wa.me/?text=${t}`;
    case "instagram": return null; // no web prefill — use the engine or copy the caption
  }
}
