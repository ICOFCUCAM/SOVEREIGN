import type { PlanStatus } from "@/lib/session";
import type { DocSummary } from "@/lib/documents";
import { getAiActivity } from "@/lib/ai-activity-log";

// In-app alerts & activity, computed from real account state — no fabricated
// events, no email. Each alert is actionable and links to where it's resolved.
export type AlertKind = "usage" | "draft" | "publish" | "growth" | "activity";
export interface Alert {
  id: string;
  kind: AlertKind;
  title: string;
  body?: string;
  to?: string;
  ts?: number;
}

export function buildAlerts(status: PlanStatus | null, docs: DocSummary[] | null): Alert[] {
  const out: Alert[] = [];
  const all = docs ?? [];

  // Usage: low image credits (paid plans meter images).
  if (status && status.imagesLim > 0) {
    const left = status.imagesLim - status.imagesUsed;
    const pct = (status.imagesUsed / status.imagesLim) * 100;
    if (pct >= 80) {
      out.push({ id: "credits-low", kind: "usage", title: `${left} image credit${left === 1 ? "" : "s"} left`, body: "You're running low this month — top up or upgrade to keep creating.", to: status.plan === "free" ? "/pricing" : "/account" });
    }
  }

  // Drafts waiting to be published.
  const drafts = all.filter((d) => !d.shared).length;
  if (drafts > 0) {
    out.push({ id: `drafts-${drafts}`, kind: "draft", title: `${drafts} unpublished draft${drafts > 1 ? "s" : ""}`, body: "Finish and share or list them to reach readers.", to: "/library?filter=drafts" });
  }

  // Shared-but-not-listed: a quick win toward the marketplace.
  const unlisted = all.filter((d) => d.shared && !d.listed).length;
  if (unlisted > 0) {
    out.push({ id: `unlisted-${unlisted}`, kind: "publish", title: `${unlisted} work${unlisted > 1 ? "s" : ""} not on the marketplace`, body: "List them so readers and schools can discover your work.", to: "/library?filter=shared" });
  }

  // Growth: real reach across published work.
  const views = all.reduce((s, d) => s + (d.view_count ?? 0), 0);
  const published = all.filter((d) => d.listed).length;
  if (published > 0 && views > 0) {
    out.push({ id: `views-${views}`, kind: "growth", title: `Your work has ${views.toLocaleString()} view${views === 1 ? "" : "s"}`, body: "See what's performing best in Insights.", to: "/insights" });
  }

  // Recent AI activity (most recent generation).
  const act = getAiActivity()[0];
  if (act) {
    out.push({ id: `act-${act.id}`, kind: "activity", title: act.status === "ok" ? `Created: ${act.tool}` : `Generation issue: ${act.tool}`, body: act.description || undefined, ts: act.ts });
  }

  return out;
}

const SEEN_KEY = "pp_alerts_seen";

export function alertsHash(alerts: Alert[]): string {
  return alerts.map((a) => a.id).join("|");
}

export function unseenCount(alerts: Alert[]): number {
  try {
    return localStorage.getItem(SEEN_KEY) === alertsHash(alerts) ? 0 : alerts.length;
  } catch {
    return alerts.length;
  }
}

export function markAlertsSeen(alerts: Alert[]): void {
  try { localStorage.setItem(SEEN_KEY, alertsHash(alerts)); } catch { /* ignore */ }
}
