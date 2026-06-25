import React, { useEffect, useState } from "react";
import { getSsoConnection, saveSsoConnection, type SsoConnection, humanError } from "../lib/api";
import { Button, Card, Field, inputCls } from "../lib/ui";

// Connect the institution's identity provider (item 2). An admin registers the
// tenant's OIDC issuer + client and the email domain that routes to it; people
// then sign in through their own IdP. The client secret is write-only — the API
// returns whether one is set, never the value.
const SsoConnectionCard: React.FC = () => {
  const [conn, setConn] = useState<SsoConnection | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ emailDomain: "", issuer: "", clientId: "", clientSecret: "", enabled: true });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = () => getSsoConnection().then((r) => { setConn(r.connection); if (r.connection) setForm((f) => ({ ...f, emailDomain: r.connection!.emailDomain, issuer: r.connection!.issuer, clientId: r.connection!.clientId, enabled: r.connection!.enabled })); }).catch(() => {}).finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setErr(null); setMsg(null);
    if (!form.issuer.trim() || !form.clientId.trim() || !form.emailDomain.trim()) { setErr("Issuer, client ID and email domain are required."); return; }
    try {
      await saveSsoConnection({ issuer: form.issuer.trim(), clientId: form.clientId.trim(), clientSecret: form.clientSecret || undefined, emailDomain: form.emailDomain.trim().toLowerCase(), enabled: form.enabled });
      setMsg("Identity provider connected. People on this domain can now sign in through it."); setEditing(false); setForm((f) => ({ ...f, clientSecret: "" })); load();
    } catch (e) { setErr(humanError(e, "Could not save the identity provider.")); }
  };

  if (!loaded) return null;

  return (
    <Card className="mb-6 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Identity Provider</div>
          <div className="mt-1 text-sm text-white/55">How your people sign in. Connect your institution's identity provider (Microsoft Entra / Azure AD, Okta, a national IdP) and staff authenticate through it — Dispatch never stores their passwords.</div>
        </div>
        {conn && !editing && <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${conn.enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/55"}`}>{conn.enabled ? "Connected" : "Disabled"}</span>}
      </div>

      {msg && <div className="mt-3 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{msg}</div>}
      {err && <div className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>}

      {conn && !editing ? (
        <div className="mt-4 grid gap-x-8 gap-y-2 text-[12.5px] sm:grid-cols-2">
          <div><span className="text-white/40">Email domain </span><span className="font-mono text-white/80">{conn.emailDomain}</span></div>
          <div><span className="text-white/40">Provider </span><span className="text-white/80 uppercase">{conn.provider}</span></div>
          <div className="sm:col-span-2"><span className="text-white/40">Issuer </span><span className="font-mono text-white/70">{conn.issuer}</span></div>
          <div><span className="text-white/40">Client ID </span><span className="font-mono text-white/70">{conn.clientId}</span></div>
          <div><span className="text-white/40">Client secret </span><span className="text-white/70">{conn.secretSet ? "set" : "—"}</span></div>
          <div className="sm:col-span-2 mt-2"><Button variant="ghost" onClick={() => setEditing(true)}>Edit connection</Button></div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {!conn && !editing && <Button onClick={() => setEditing(true)}>Connect an identity provider</Button>}
          {editing && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email domain"><input className={inputCls} value={form.emailDomain} onChange={(e) => setForm({ ...form, emailDomain: e.target.value })} placeholder="ministry.gov" /></Field>
                <Field label="OIDC issuer"><input className={inputCls} value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="https://login.microsoftonline.com/<tenant>/v2.0" /></Field>
                <Field label="Client ID"><input className={inputCls} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} placeholder="application (client) id" /></Field>
                <Field label={conn ? "Client secret (leave blank to keep)" : "Client secret"}><input className={inputCls} type="password" value={form.clientSecret} onChange={(e) => setForm({ ...form, clientSecret: e.target.value })} placeholder="••••••••" /></Field>
              </div>
              <label className="flex items-center gap-2 text-[12px] text-white/55"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled</label>
              <div className="flex gap-2"><Button onClick={save}>Save connection</Button><Button variant="ghost" onClick={() => { setEditing(false); setErr(null); }}>Cancel</Button></div>
              <p className="text-[11px] text-white/35">Redirect URI to register at your IdP: <code className="font-mono text-white/55">&lt;your-api-host&gt;/v1/auth/sso/callback</code></p>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default SsoConnectionCard;
