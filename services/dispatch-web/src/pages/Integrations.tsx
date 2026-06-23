import React from "react";
import { Card } from "../lib/ui";
import { useAuth } from "../lib/auth";

// Integrations — the consumer-facing API surface. This is documentation backed by
// the real endpoints the console itself uses; it shows the signed-in client's
// actual granted scopes rather than any invented capability.
const SCOPES: { scope: string; grants: string }[] = [
  { scope: "dispatch:validate", grants: "Validate a DDM payload against schema + doc-type policy" },
  { scope: "dispatch:render", grants: "Submit documents and trigger rendering" },
  { scope: "dispatch:approve", grants: "Make governance decisions (approve / return / reject)" },
  { scope: "dispatch:publish", grants: "Release a rendered document to the official record" },
  { scope: "dispatch:read", grants: "List and retrieve documents and artefacts" },
  { scope: "dispatch:audit", grants: "Read the append-only audit trail" },
];

const ENDPOINTS: { method: string; path: string; desc: string }[] = [
  { method: "POST", path: "/v1/token", desc: "Client-credentials exchange → short-lived scoped JWT" },
  { method: "POST", path: "/v1/validate", desc: "Validate a DDM payload before submission" },
  { method: "POST", path: "/v1/documents", desc: "Submit a document (Idempotency-Key honoured)" },
  { method: "GET", path: "/v1/documents", desc: "List documents the caller is cleared to see" },
  { method: "POST", path: "/v1/documents/:id/decision", desc: "Governance decision (approve / return / reject)" },
  { method: "POST", path: "/v1/documents/:id/publish", desc: "Publish a rendered document to the record" },
  { method: "GET", path: "/v1/audit", desc: "Append-only, tenant-scoped audit events" },
  { method: "POST", path: "/v1/artifacts/:id/grant", desc: "Mint a signed, expiring artefact download URL" },
];

const METHOD_STYLE: Record<string, string> = {
  GET: "text-sky-300",
  POST: "text-emerald-300",
};

const Integrations: React.FC = () => {
  const { session, has } = useAuth();
  const base = (import.meta.env.VITE_DISPATCH_API_URL as string) || `${window.location.origin}`;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-sm text-white/50">
          Connect an institutional system to Dispatch over a stable REST surface. Each consumer authenticates with its own
          scoped service client.
        </p>
      </header>

      {/* this client */}
      <Card className="mb-6 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">This connection</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Client</div>
            <div className="font-mono text-sm text-white">{session?.subject ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">API base</div>
            <div className="truncate font-mono text-sm text-white">{base}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Tenant</div>
            <div className="font-mono text-sm text-white">{session?.tenantId?.slice(0, 8) ?? "—"}…</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* scopes */}
        <Card className="p-6">
          <h2 className="mb-1 text-base font-bold text-white">Scopes</h2>
          <p className="mb-4 text-xs text-white/45">Granted to this client are highlighted. Scope is enforced server-side on every call.</p>
          <ul className="space-y-2.5">
            {SCOPES.map((s) => {
              const held = has(s.scope);
              return (
                <li key={s.scope} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${held ? "bg-emerald-400" : "bg-white/15"}`} />
                  <div>
                    <span className={`font-mono text-xs ${held ? "text-white" : "text-white/40"}`}>{s.scope}</span>
                    {held && <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">granted</span>}
                    <div className="text-xs leading-snug text-white/45">{s.grants}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* endpoints */}
        <Card className="p-6">
          <h2 className="mb-1 text-base font-bold text-white">REST surface</h2>
          <p className="mb-4 text-xs text-white/45">Stable, versioned endpoints. The console is built on these same calls.</p>
          <ul className="divide-y divide-white/5">
            {ENDPOINTS.map((e) => (
              <li key={e.method + e.path} className="flex items-baseline gap-3 py-2">
                <span className={`w-12 shrink-0 font-mono text-[11px] font-bold ${METHOD_STYLE[e.method] ?? "text-white/60"}`}>{e.method}</span>
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs text-white">{e.path}</div>
                  <div className="text-[11px] leading-snug text-white/40">{e.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* quickstart */}
      <Card className="mt-6 p-6">
        <h2 className="mb-3 text-base font-bold text-white">Quickstart</h2>
        <pre className="overflow-x-auto rounded-md border border-white/10 bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-white/70">{`# 1 — exchange credentials for a scoped token
curl -X POST ${base}/v1/token \\
  -H 'content-type: application/json' \\
  -d '{"client_id":"svc-...","secret":"..."}'

# 2 — submit a structured document (idempotent)
curl -X POST ${base}/v1/documents \\
  -H "authorization: Bearer $TOKEN" \\
  -H 'idempotency-key: <uuid>' \\
  -H 'content-type: application/json' \\
  -d @document.json`}</pre>
        <p className="mt-3 text-xs text-white/35">
          Service clients are issued, scoped and revoked per consumer. Contact your tenant administrator to provision one.
        </p>
      </Card>
    </div>
  );
};

export default Integrations;
