import { createHash } from "node:crypto";

// Who may use the runner. Two independent checks, both server-side:
//   1. Supabase confirms the access token belongs to a live, signed-in user.
//   2. That user's id is on this server's own allowlist (RUNNER_ADMIN_USER_IDS)
//      AND Polished Pages lists them as an admin (polished_is_admin).
// Nothing the browser says about itself is trusted. Verified tokens are
// remembered for one minute so a streaming page doesn't hit Supabase per call.
const TTL_MS = 60_000;

export function createAuth(cfg, fetchImpl = fetch) {
  const cache = new Map();

  async function verify(authorization) {
    const m = /^Bearer\s+(.+)$/i.exec(authorization || "");
    if (!m) return { ok: false, status: 401, error: "Sign in to use Claude Studio." };
    const token = m[1].trim();
    const key = createHash("sha256").update(token).digest("hex");
    const hit = cache.get(key);
    if (hit && hit.until > Date.now()) return hit.result;

    const headers = { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${token}` };
    let result;
    try {
      const r = await fetchImpl(`${cfg.supabaseUrl}/auth/v1/user`, { headers });
      if (!r.ok) result = { ok: false, status: 401, error: "Your session has expired. Sign in again." };
      else {
        const u = await r.json();
        if (!u?.id || !cfg.adminUserIds.has(u.id)) result = { ok: false, status: 403, error: "Claude Studio is private to the site owner." };
        else {
          const a = await fetchImpl(`${cfg.supabaseUrl}/rest/v1/rpc/polished_is_admin`, {
            method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: "{}",
          });
          const isAdmin = a.ok && (await a.json()) === true;
          result = isAdmin ? { ok: true, user: { id: u.id, email: u.email ?? null } }
            : { ok: false, status: 403, error: "Claude Studio is private to the site owner." };
        }
      }
    } catch {
      return { ok: false, status: 503, error: "Sign-in could not be checked right now. Try again." };
    }
    cache.set(key, { until: Date.now() + TTL_MS, result });
    if (cache.size > 200) for (const [k, v] of cache) if (v.until < Date.now()) cache.delete(k);
    return result;
  }

  return { verify };
}
