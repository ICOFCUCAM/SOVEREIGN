// exit-dispatch-submit: ExitOS → Sovereign Dispatch bridge. Holds the Dispatch
// service credentials (as function secrets), exchanges them for a short-lived
// JWT, and submits a DDM document to the Dispatch publication pipeline. The
// browser only sends the document — no Dispatch secret is ever exposed.
//
// Secrets (function env):
//   DISPATCH_API_URL       e.g. https://dispatch-api.example.com
//   DISPATCH_CLIENT_ID     e.g. svc-exitos
//   DISPATCH_CLIENT_SECRET the service client secret
//
// POST body: { document: <DDM>, outputs?: ["pdf"] }
// Returns the Dispatch submit result, or { configured:false } when not wired —
// it never fakes a submission.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...cors } });

const env = (k: string) => Deno.env.get(k);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const apiUrl = env("DISPATCH_API_URL");
  const clientId = env("DISPATCH_CLIENT_ID");
  const clientSecret = env("DISPATCH_CLIENT_SECRET");
  if (!apiUrl || !clientId || !clientSecret) {
    return json({ configured: false, error: "Dispatch is not configured — set DISPATCH_API_URL, DISPATCH_CLIENT_ID, DISPATCH_CLIENT_SECRET on exit-dispatch-submit." });
  }

  let payload: { document?: unknown; outputs?: string[] };
  try { payload = await req.json(); } catch { return json({ error: "invalid JSON body" }, 400); }
  if (!payload?.document) return json({ error: "a 'document' (DDM) is required" }, 400);
  const outputs = Array.isArray(payload.outputs) && payload.outputs.length ? payload.outputs : ["pdf"];

  const base = apiUrl.replace(/\/+$/, "");
  try {
    // 1) client-credentials → short-lived JWT
    const tok = await fetch(`${base}/v1/token`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, secret: clientSecret }),
    });
    if (!tok.ok) return json({ configured: true, error: `Dispatch token ${tok.status}: ${(await tok.text()).slice(0, 240)}` }, 502);
    const tokJson = await tok.json().catch(() => ({}));
    const token = tokJson?.access_token ?? tokJson?.token;
    if (!token) return json({ configured: true, error: "Dispatch did not return an access token" }, 502);

    // 2) submit the document (Submit → governed lifecycle; service lane auto-approves → render)
    const sub = await fetch(`${base}/v1/documents`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ document: payload.document, outputs }),
    });
    const body = await sub.json().catch(() => ({}));
    if (!sub.ok) return json({ configured: true, error: body?.error ?? `Dispatch submit ${sub.status}` }, 502);
    return json({ configured: true, ok: true, ...body });
  } catch (e) {
    return json({ configured: true, error: (e as Error).message }, 502);
  }
});
