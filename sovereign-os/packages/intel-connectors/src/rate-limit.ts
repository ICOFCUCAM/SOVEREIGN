// Rate-limit middleware. Wraps fetch with a per-source token bucket
// so connectors honour provider quotas without each implementation
// re-implementing the same logic. The runner injects the wrapped
// fetch into ConnectorContext.

export interface RateLimitPolicy {
  readonly requestsPerMinute?: number;
  readonly requestsPerHour?: number;
  readonly burst?: number;
}

interface BucketState {
  tokens: number;
  capacity: number;
  refillPerMs: number;
  lastRefillMs: number;
  // Optional per-hour ceiling enforced separately from the per-minute bucket.
  hourlyTokens: number;
  hourlyCapacity: number;
  hourlyRefillPerMs: number;
  hourlyLastRefillMs: number;
}

const STATES = new Map<string, BucketState>();

function refill(state: BucketState, now: number): void {
  const elapsed = Math.max(0, now - state.lastRefillMs);
  // Guard: Infinity refill rate means "uncapped" — leave tokens at their
  // existing value rather than computing 0 * Infinity = NaN.
  if (state.refillPerMs !== Infinity) {
    state.tokens = Math.min(state.capacity, state.tokens + elapsed * state.refillPerMs);
  } else if (state.capacity !== Infinity) {
    state.tokens = state.capacity;
  }
  state.lastRefillMs = now;

  const hElapsed = Math.max(0, now - state.hourlyLastRefillMs);
  if (state.hourlyRefillPerMs !== Infinity) {
    state.hourlyTokens = Math.min(state.hourlyCapacity, state.hourlyTokens + hElapsed * state.hourlyRefillPerMs);
  } else if (state.hourlyCapacity !== Infinity) {
    state.hourlyTokens = state.hourlyCapacity;
  }
  state.hourlyLastRefillMs = now;
}

export function isRateLimitPolicy(v: unknown): v is RateLimitPolicy {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return typeof r.requestsPerMinute === 'number'
      || typeof r.requestsPerHour   === 'number'
      || typeof r.burst             === 'number';
}

function getState(key: string, policy: RateLimitPolicy): BucketState {
  let s = STATES.get(key);
  if (s) return s;

  const rpm = policy.requestsPerMinute ?? Infinity;
  const rph = policy.requestsPerHour   ?? Infinity;
  const burst = policy.burst ?? Math.max(1, Math.min(rpm, 60));

  s = {
    tokens: burst,
    capacity: burst,
    refillPerMs: rpm === Infinity ? Infinity : rpm / 60_000,
    lastRefillMs: Date.now(),
    hourlyTokens: rph,
    hourlyCapacity: rph,
    hourlyRefillPerMs: rph === Infinity ? Infinity : rph / 3_600_000,
    hourlyLastRefillMs: Date.now(),
  };
  STATES.set(key, s);
  return s;
}

export interface RateLimitedFetchOptions {
  readonly key: string;
  readonly policy: RateLimitPolicy;
  readonly fetchImpl?: typeof fetch;
  readonly clock?: () => number;
  readonly sleep?: (ms: number) => Promise<void>;
}

// Returns a fetch with bucket-checking semantics. If no tokens are
// available, it waits the minimum interval and retries — up to a hard
// 30-second ceiling per call, then throws. clock and sleep are
// injectable so tests can drive the bucket deterministically without
// real time passing.
export function rateLimitedFetch(opts: RateLimitedFetchOptions): typeof fetch {
  const realFetch = opts.fetchImpl ?? fetch;
  const clock = opts.clock ?? (() => Date.now());
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  return (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const state = getState(opts.key, opts.policy);
    const deadline = clock() + 30_000;

    while (true) {
      refill(state, clock());
      if (state.tokens >= 1 && state.hourlyTokens >= 1) {
        state.tokens     -= 1;
        state.hourlyTokens -= 1;
        return realFetch(input, init);
      }
      if (clock() >= deadline) {
        throw new Error(`rate-limit: bucket ${opts.key} exhausted (deadline 30s)`);
      }
      const waitMs = Math.min(
        state.refillPerMs       === Infinity ? Infinity : Math.ceil(1 / state.refillPerMs),
        state.hourlyRefillPerMs === Infinity ? Infinity : Math.ceil(1 / state.hourlyRefillPerMs),
      );
      await sleep(Math.min(1_000, Math.max(50, isFinite(waitMs) ? waitMs : 100)));
    }
  }) as typeof fetch;
}

// Test-only: clear bucket state between runs.
export function _resetRateLimitState(): void {
  STATES.clear();
}
