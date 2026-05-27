// Usage metering + rate limiting (the "Monthly API Calls" surface).

export interface RateLimit {
  /** Max requests allowed in the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface UsageWindow {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string; // ISO
  exceeded: boolean;
}

/** Pure rate-limit evaluation; the caller supplies the current count for the window. */
export function evaluateRate(used: number, limit: RateLimit, windowStart: Date = new Date()): UsageWindow {
  const remaining = Math.max(0, limit.limit - used);
  const resetAt = new Date(windowStart.getTime() + limit.windowSeconds * 1000).toISOString();
  return { used, limit: limit.limit, remaining, resetAt, exceeded: used >= limit.limit };
}

export interface UsageEvent {
  client_id: string;
  key_id?: string;
  metric: 'api_call' | 'post' | 'media_render' | 'intelligence_run' | 'comment';
  units?: number;
  at?: string;
}

export function meterEvent(client_id: string, metric: UsageEvent['metric'], key_id?: string, units = 1): UsageEvent {
  return { client_id, key_id, metric, units, at: new Date().toISOString() };
}
