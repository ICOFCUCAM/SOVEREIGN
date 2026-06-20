// Entitlement gate for Polished Pages. Generation is metered per signed-in user:
// a free monthly quota, enforced server-side so the client can never bypass it.
// Each generator calls getUserId(req) then consumeOrThrow(userId) before it
// produces a document. Backed by public.polished_consume_generation on the
// SOVEREIGN database.

export class EntitlementError extends Error {
  status: number;
  plan?: string;
  used?: number;
  limit?: number;
  constructor(message: string, status: number, extra?: { plan?: string; used?: number; limit?: number }) {
    super(message);
    this.name = "EntitlementError";
    this.status = status;
    if (extra) { this.plan = extra.plan; this.used = extra.used; this.limit = extra.limit; }
  }
}

// Read the verified claims from the request's bearer token. With verify_jwt
// enabled the gateway has already validated the signature; we only read claims.
// Anonymous (anon-key) calls have no user subject and are rejected.
function readClaims(req: Request): { sub: string; email?: string } {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length !== 3) throw new EntitlementError("Sign in to generate documents.", 401);
  let claims: { sub?: string; role?: string; email?: string };
  try {
    const seg = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = seg.padEnd(Math.ceil(seg.length / 4) * 4, "=");
    claims = JSON.parse(atob(padded));
  } catch {
    throw new EntitlementError("Invalid session.", 401);
  }
  if (claims.role !== "authenticated" || !claims.sub) throw new EntitlementError("Sign in to generate documents.", 401);
  return { sub: claims.sub, email: claims.email };
}

export function getUserId(req: Request): string {
  return readClaims(req).sub;
}

export function getUserContext(req: Request): { id: string; email?: string } {
  const c = readClaims(req);
  return { id: c.sub, email: c.email };
}

// Atomically check and increment the user's monthly quota via the service role.
// Text and images are metered separately (images run on a credit pool, since
// each gpt-image-1 call is a real cost). Throws 402 when the allowance is spent.
export async function consumeOrThrow(
  userId: string,
  kind: "text" | "image" = "text",
): Promise<{ plan: string; used: number; limit: number }> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new EntitlementError("Metering is not configured on this deployment.", 503);

  const r = await fetch(`${url}/rest/v1/rpc/polished_consume_generation`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: key, authorization: `Bearer ${key}` },
    body: JSON.stringify({ p_user_id: userId, p_kind: kind }),
  });
  if (!r.ok) {
    console.error("polished_consume_generation failed", r.status, await r.text().catch(() => ""));
    throw new EntitlementError("Could not verify your plan. Please try again.", 502);
  }
  const rows = await r.json();
  const row = Array.isArray(rows) ? rows[0] : rows;
  const plan = row?.plan ?? "free";
  const used = row?.used ?? 0;
  const limit = row?.lim ?? 0;
  if (!row?.allowed) {
    const message = kind === "image"
      ? `You've used all ${limit} image credits this month. Upgrade to Pro for more.`
      : `You've used all ${limit} free generations this month. Upgrade to Pro for unlimited.`;
    throw new EntitlementError(message, 402, { plan, used, limit });
  }
  return { plan, used, limit };
}
