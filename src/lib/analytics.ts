/**
 * Telemetry layer. Captures domain engagement events into `analytics_events`.
 *
 * Design rule: analytics must NEVER block or break the user experience. Every
 * write is fire-and-forget and swallows its own errors.
 */
import { supabase } from './supabase';

const VISITOR_KEY = 'sov_visitor_id';
const SESSION_KEY = 'sov_session_id';

function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** Stable per-browser identifier (persists across sessions). */
export function getVisitorId(): string {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = uid();
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    return 'anonymous';
  }
}

/** Per-tab/session identifier (resets when the tab is closed). */
export function getSessionId(): string {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = uid();
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return 'anonymous';
  }
}

function detectDevice(ua: string): string {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

/** Classify where the visit originated for traffic-origin reporting. */
export function trafficOrigin(referrer: string, currentHost: string): string {
  if (!referrer) return 'direct';
  try {
    const r = new URL(referrer);
    if (r.host === currentHost) return 'internal';
    if (/google|bing|duckduckgo|yahoo|baidu|yandex/i.test(r.host)) return 'search';
    if (/t\.co|twitter|x\.com|facebook|linkedin|instagram|reddit|youtube/i.test(r.host)) return 'social';
    return 'referral';
  } catch {
    return 'referral';
  }
}

export type DomainEventType =
  | 'view'
  | 'cta_click'
  | 'inquiry'
  | 'offer'
  | 'buy_now'
  | 'modal_open'
  | 'film_play';

export interface TrackOptions {
  domainId?: string | null;
  eventType: DomainEventType;
  path?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(opts: TrackOptions): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const ua = navigator.userAgent;
    const referrer = document.referrer || '';
    await supabase.from('analytics_events').insert({
      domain_id: opts.domainId ?? null,
      event_type: opts.eventType,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      device: detectDevice(ua),
      browser: detectBrowser(ua),
      referrer: referrer || null,
      path: opts.path ?? window.location.pathname,
      metadata: {
        traffic_origin: trafficOrigin(referrer, window.location.host),
        host: window.location.host,
        ...(opts.metadata ?? {}),
      },
    });
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[analytics] trackEvent failed', e);
  }
}
