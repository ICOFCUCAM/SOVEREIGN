import React, { useEffect, useMemo, useState } from "react";
import { PublicHeader, PageBanner, PublicFooter, SectionHead, FilmGrain, useReveal } from "../components/brand";

// Developer Platform — the public documentation surface for the Dispatch Platform
// API (the governance engine). Quickstart, SDKs, webhooks, and a LIVE endpoint
// reference rendered from the shipped OpenAPI spec (/openapi.json) so it never
// drifts from the implementation. Public, on the marketing chrome.

const CodeBlock: React.FC<{ code: string; label?: string }> = ({ code, label }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      {label && <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">{label}</div>}
      <button onClick={() => { navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
        className="absolute right-2 top-2 z-10 rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70 hover:bg-white/20">{copied ? "Copied" : "Copy"}</button>
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12.5px] leading-relaxed text-white/75">{code}</pre>
    </div>
  );
};

interface Op { tags?: string[]; summary?: string }
interface Spec { info?: { title?: string; version?: string }; tags?: { name: string; description?: string }[]; servers?: { url: string; description?: string }[]; paths: Record<string, Record<string, Op>> }

const METHOD_CLS: Record<string, string> = {
  GET: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  POST: "text-seal-light border-seal-light/30 bg-seal/15",
  DELETE: "text-red-300 border-red-400/30 bg-red-400/10",
  PUT: "text-amber-300 border-amber-400/30 bg-amber-400/10",
};

const EVENTS = ["record.submitted", "record.approved", "record.rejected", "record.returned", "record.published", "record.preserved"];

const Developers: React.FC = () => {
  useReveal();
  const [spec, setSpec] = useState<Spec | null>(null);
  useEffect(() => { fetch("/openapi.json").then((r) => r.json()).then(setSpec).catch(() => {}); }, []);

  const groups = useMemo(() => {
    if (!spec) return [] as [string, { method: string; path: string; summary?: string }[]][];
    const byTag: Record<string, { method: string; path: string; summary?: string }[]> = {};
    for (const [p, methods] of Object.entries(spec.paths))
      for (const [m, op] of Object.entries(methods)) {
        const tag = op.tags?.[0] || "Other";
        (byTag[tag] = byTag[tag] || []).push({ method: m.toUpperCase(), path: p, summary: op.summary });
      }
    const order = (spec.tags || []).map((t) => t.name);
    return Object.entries(byTag).sort((a, b) => (order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99));
  }, [spec]);

  const tagDesc = useMemo(() => Object.fromEntries((spec?.tags || []).map((t) => [t.name, t.description])), [spec]);
  const pathCount = spec ? Object.values(spec.paths).reduce((n, m) => n + Object.keys(m).length, 0) : 0;

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="default" alt="" />
      <main>
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Developer Platform</div>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-[3.2rem]">Build governance into your own systems.</h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/55">
              The <span className="text-white/80">Dispatch Platform API</span> is the governance engine behind Sovereign Dispatch. Your ERP, parliament system, SharePoint or case platform can submit a document and have it governed, certified, published and preserved as an Official Record — without anyone opening the console.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/openapi.json" download className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/85">Download OpenAPI spec ↓</a>
              <a href="#reference" className="rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40">Endpoint reference →</a>
              <a href="/signup" className="rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40">Get a credential</a>
            </div>
          </div>
        </section>

        {/* ── Quickstart ────────────────────────────────────────────── */}
        <section className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-8 py-24 lg:px-12">
          <SectionHead index="01" kicker="Quickstart" title="Credential → token → governed record."
            sub="An administrator issues an API client under Administration → API Access, scoped to exactly what the system may do. The system exchanges it for a short-lived bearer token, then calls the API." />
          <div className="mx-auto mt-12 max-w-3xl space-y-5">
            <CodeBlock label="1 · Exchange the credential for a token" code={`curl -s https://api.dispatch.sovereigndo.com/v1/token \\
  -H 'content-type: application/json' \\
  -d '{"client_id":"svc_…","secret":"sdk_…"}'
# → { "access_token": "…", "expiresIn": 3600 }`} />
            <CodeBlock label="2 · Submit a document as an Official Record" code={`curl -s https://api.dispatch.sovereigndo.com/v1/documents \\
  -H "authorization: Bearer $TOKEN" \\
  -H 'content-type: application/json' \\
  -H "idempotency-key: $(uuidgen)" \\
  -d @record.json
# → { "documentId": "…", "lifecycle": "in_review" }`} />
            <CodeBlock label="3 · Follow it through governance" code={`# whose turn is it? the posture + chain of authority
curl -s https://api.dispatch.sovereigndo.com/v1/documents/$ID \\
  -H "authorization: Bearer $TOKEN"
# approve (only the office whose step is open may), then publish
# then GET …/governance-certificate for proof the chain was satisfied`} />
          </div>
        </section>

        {/* ── SDKs ──────────────────────────────────────────────────── */}
        <section className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="02" kicker="SDKs" title="Official clients, zero dependencies."
            sub="Thin, hand-written clients for TypeScript and Python that wrap the auth flow, the record lifecycle, and webhook signature verification. The signature scheme is verified to match the server across both languages." />
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-white/45">TypeScript · Node ≥ 18</div>
              <CodeBlock code={`import { DispatchClient, verifyWebhook } from "@dispatch/sdk";

const dispatch = new DispatchClient({ baseUrl, clientId, secret });
const { documentId } = await dispatch.createRecord(record);
await dispatch.decide(documentId, "approve");
await dispatch.publish(documentId);

// verify an inbound webhook before trusting it
if (!verifyWebhook(rawBody, sigHeader, secret)) reject();`} />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-white/45">Python ≥ 3.8 · stdlib only</div>
              <CodeBlock code={`from dispatch import DispatchClient, verify_webhook

d = DispatchClient(base_url, client_id, secret)
res = d.create_record(record, idempotency_key=str(uuid4()))
d.decide(res["documentId"], "approve")
d.publish(res["documentId"])

if not verify_webhook(raw_body, sig_header, secret):
    reject()`} />
            </div>
          </div>
        </section>

        {/* ── Webhooks ──────────────────────────────────────────────── */}
        <section className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-8 py-24 lg:px-12">
          <SectionHead index="03" kicker="Webhooks" title="React to governance, don't poll for it."
            sub="Register endpoints and Dispatch POSTs a signed event when a record crosses a lifecycle boundary. Delivery is durable and at-least-once; verify every delivery with the endpoint's signing secret." />
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="mb-5 flex flex-wrap gap-2">
              {EVENTS.map((e) => <span key={e} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[12px] text-white/70">{e}</span>)}
            </div>
            <CodeBlock label="Verify the signature (Node)" code={`const expected = "sha256=" +
  crypto.createHmac("sha256", endpointSecret).update(rawBody).digest("hex");
if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) reject();
// payload: { event, occurredAt, tenantId, data: { documentId, lifecycle, … } }
// make your handler idempotent on the X-Dispatch-Delivery header`} />
          </div>
        </section>

        {/* ── Endpoint reference (live from the spec) ───────────────── */}
        <section id="reference" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="04" kicker="Reference" title="Every endpoint, from the live spec."
            sub={spec ? `${pathCount} operations across ${groups.length} groups — rendered from the shipped OpenAPI document, so it never drifts from the running API.` : "Loading the API specification…"} />
          <div className="mx-auto mt-12 max-w-4xl space-y-10">
            {groups.map(([tag, ops]) => (
              <div key={tag}>
                <h3 className="font-serif text-xl font-bold text-white">{tag}</h3>
                {tagDesc[tag] && <p className="mt-1 text-[13px] text-white/45">{tagDesc[tag]}</p>}
                <ul className="mt-4 divide-y divide-white/[0.06] rounded-lg border border-white/[0.08]">
                  {ops.map((o, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <span className={`w-16 shrink-0 rounded border px-1.5 py-0.5 text-center font-mono text-[11px] font-bold ${METHOD_CLS[o.method] || "text-white/60 border-white/20"}`}>{o.method}</span>
                      <code className="font-mono text-[12.5px] text-white/80">{o.path}</code>
                      <span className="min-w-0 flex-1 truncate text-right text-[12.5px] text-white/40">{o.summary}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!spec && <div className="text-sm text-white/30">If this does not load, the spec is also downloadable above.</div>}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Developers;
