import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { Button, Card, Field, inputCls, timeAgo } from "../lib/ui";
import { listClients, issueClient, rotateClient, revokeClient, getBilling, subscribe, type ServiceClient, type IssuedCredential, humanError } from "../lib/api";
import { QuotaMeter, planLabel, useBilling } from "../lib/upsell";
import SsoConnectionCard from "../components/SsoConnectionCard";

// ACCESS — tenant self-service for API credentials. A tenant_admin issues a
// service client (client_id + secret), rotates its secret, or revokes it. The
// raw secret is shown exactly once, here, at issue and rotation — the server
// only ever stores its scrypt hash. Backed by /v1/admin/clients (dispatch:admin).

// Self-issuable scopes (dispatch:admin is deliberately excluded server-side — no
// privilege-escalation chains — so it isn't offered here).
const SCOPES: { id: string; label: string; blurb: string }[] = [
  { id: "dispatch:validate", label: "Validate", blurb: "dry-run document validation" },
  { id: "dispatch:render", label: "Submit & render", blurb: "submit documents into the pipeline" },
  { id: "dispatch:read", label: "Read", blurb: "retrieve jobs, documents, artifacts" },
  { id: "dispatch:approve", label: "Approve", blurb: "act on the approval queue" },
  { id: "dispatch:publish", label: "Publish", blurb: "release / withdraw records" },
  { id: "dispatch:audit", label: "Audit", blurb: "read the audit trail" },
];
const DEFAULT_SCOPES = new Set(["dispatch:validate", "dispatch:render", "dispatch:read"]);

const Reveal: React.FC<{ cred: IssuedCredential; label: string; onClose: () => void }> = ({ cred, label, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(cred.secret).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };
  return (
    <Card className="mb-6 border-emerald-500/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-emerald-300">{label}</div>
          <div className="mt-0.5 text-xs text-white/50">Store this secret now — it is shown only once and cannot be retrieved again.</div>
        </div>
        <button onClick={onClose} className="text-xs font-semibold text-white/40 hover:text-white">Dismiss</button>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-white/40">Client ID</span>
          <code className="select-all rounded bg-ink-900/70 px-2 py-1 font-mono text-[12.5px] text-white/85">{cred.client_id}</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-white/40">Secret</span>
          <code className="select-all break-all rounded bg-ink-900/70 px-2 py-1 font-mono text-[12.5px] text-emerald-200">{cred.secret}</code>
          <Button variant="ghost" className="shrink-0 px-2.5 py-1 text-[12px]" onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
        </div>
      </div>
    </Card>
  );
};

const Access: React.FC = () => {
  const { has } = useAuth();
  const admin = has("dispatch:admin");

  const [clients, setClients] = useState<ServiceClient[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<Set<string>>(new Set(DEFAULT_SCOPES));
  const [issuing, setIssuing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ cred: IssuedCredential; label: string } | null>(null);
  const { billing, setBilling } = useBilling();
  const [subBusy, setSubBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try { const r = await listClients(); setClients(r.clients); }
    catch (e) { setErr(humanError(e, "failed to load credentials")); setClients([]); }
    try { setBilling(await getBilling()); } catch { /* non-fatal */ }
  }, []);
  useEffect(() => { if (admin) load(); }, [admin, load]);

  const doSubscribe = async () => {
    setSubBusy(true); setErr(null);
    try { setBilling(await subscribe()); }
    catch (e) { setErr(humanError(e, "failed to subscribe")); }
    finally { setSubBusy(false); }
  };

  const toggle = (id: string) => setScopes((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const issue = async () => {
    if (!name.trim() || scopes.size === 0) return;
    setIssuing(true); setErr(null);
    try {
      const cred = await issueClient(name.trim(), [...scopes]);
      setReveal({ cred, label: "Credential issued" });
      setName(""); setScopes(new Set(DEFAULT_SCOPES));
      await load();
    } catch (e) { setErr(humanError(e, "failed to issue credential")); }
    finally { setIssuing(false); }
  };

  const rotate = async (cid: string) => {
    setBusy(cid); setErr(null);
    try { const cred = await rotateClient(cid); setReveal({ cred, label: "Secret rotated" }); await load(); }
    catch (e) { setErr(humanError(e, "failed to rotate secret")); }
    finally { setBusy(null); }
  };

  const revoke = async (cid: string) => {
    setBusy(cid); setErr(null); setConfirmRevoke(null);
    try { await revokeClient(cid); await load(); }
    catch (e) { setErr(humanError(e, "failed to revoke credential")); }
    finally { setBusy(null); }
  };

  if (!admin) {
    return (
      <div>
        <h1 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">Access</h1>
        <Card className="mt-5 p-5">
          <div className="text-sm text-white/70">Managing API credentials requires the <code className="font-mono text-white/90">dispatch:admin</code> scope.</div>
          <div className="mt-1 text-[13px] text-white/45">Sign in with a tenant administrator credential, or ask your Dispatch operator to provision one.</div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">Access</h1>
        <p className="text-sm text-white/50">Issue and manage the API credentials your systems use to reach Dispatch. A credential is a <span className="text-white/75">client_id</span> and a one-time <span className="text-white/75">secret</span>, exchanged at <code className="font-mono text-white/70">/v1/token</code> for a short-lived bearer token.</p>
      </div>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      {reveal && <Reveal cred={reveal.cred} label={reveal.label} onClose={() => setReveal(null)} />}

      {/* How people sign in — the institution's identity provider (item 2). */}
      <SsoConnectionCard />

      {billing && (
        <Card className={`mb-6 p-5 ${billing.canDownload ? "border-emerald-500/30" : "border-amber-500/30"}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[260px] flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{planLabel(billing.plan)} plan</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${billing.canDownload ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{billing.canDownload ? "Downloads unlocked" : "Downloads locked"}</span>
              </div>
              <QuotaMeter b={billing} className="mt-2 max-w-xs" />
              {!billing.canDownload && <div className="mt-1.5 text-[12px] text-white/45">Subscribe for unlimited records, PDF/DOCX downloads, preservation and audit retention.</div>}
            </div>
            {!billing.canDownload && (
              <Button variant="primary" disabled={subBusy} onClick={doSubscribe}>{subBusy ? "Subscribing…" : "Subscribe"}</Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* existing credentials */}
        <Card className="p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/50">Credentials</h2>
          {clients === null ? (
            <div className="text-sm text-white/40">Loading…</div>
          ) : clients.length === 0 ? (
            <div className="text-sm text-white/40">No credentials yet. Issue one on the right.</div>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {clients.map((c) => (
                <li key={c.client_id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${c.active ? "bg-emerald-400" : "bg-white/25"}`} />
                        <span className="truncate text-sm font-semibold text-white">{c.name}</span>
                        {!c.active && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/40">revoked</span>}
                      </div>
                      <code className="mt-1 block truncate font-mono text-[12px] text-white/55">{c.client_id}</code>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(c.scopes || []).map((s) => <span key={s} className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-white/45">{s.replace("dispatch:", "")}</span>)}
                      </div>
                      <div className="mt-1.5 text-[11px] text-white/35">
                        issued {timeAgo(c.created_at)}{c.last_used_at ? ` · last used ${timeAgo(c.last_used_at)}` : " · never used"}{c.last_rotated_at ? ` · rotated ${timeAgo(c.last_rotated_at)}` : ""}
                      </div>
                    </div>
                    {c.active && (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button variant="ghost" className="px-2.5 py-1 text-[12px]" disabled={busy === c.client_id} onClick={() => rotate(c.client_id)}>{busy === c.client_id ? "…" : "Rotate"}</Button>
                        {confirmRevoke === c.client_id ? (
                          <>
                            <Button variant="danger" className="px-2.5 py-1 text-[12px]" disabled={busy === c.client_id} onClick={() => revoke(c.client_id)}>Confirm</Button>
                            <button onClick={() => setConfirmRevoke(null)} className="text-[12px] text-white/40 hover:text-white/70">Cancel</button>
                          </>
                        ) : (
                          <Button variant="ghost" className="px-2.5 py-1 text-[12px] text-red-300/80 hover:text-red-200" onClick={() => setConfirmRevoke(c.client_id)}>Revoke</Button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* issue a new credential */}
        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">Issue a credential</h2>
            <Field label="Name" hint="What system will use it? e.g. “Core API”, “Reporting Pipeline”.">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Core API" />
            </Field>
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/50">Scopes</span>
              <div className="space-y-2">
                {SCOPES.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-start gap-2.5 text-sm">
                    <input type="checkbox" className="mt-0.5" checked={scopes.has(s.id)} onChange={() => toggle(s.id)} />
                    <span>
                      <span className="font-medium text-white/85">{s.label}</span>
                      <span className="ml-2 text-[12px] text-white/40">{s.blurb}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Button variant="primary" className="w-full" disabled={issuing || !name.trim() || scopes.size === 0} onClick={issue}>
              {issuing ? "Issuing…" : "Issue credential"}
            </Button>
            <p className="text-[11px] leading-relaxed text-white/35">The secret is generated by the server, stored only as a scrypt hash, and shown once. Hand it to the consuming system over a secure channel.</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Access;
