import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { Button, Field, inputCls } from "../lib/ui";

// Two ways in:
//   - Service client credentials (machine / operator integrations).
//   - Human SSO: paste/redirect-back an identity-provider (Supabase) user JWT.
// Either way the API resolves role/scopes/clearance from the membership record
// (/v1/whoami) — the console never trusts a token's self-asserted role.
const SignIn: React.FC = () => {
  const { signIn, signInSso, loading, error } = useAuth();
  const [mode, setMode] = useState<"sso" | "service">("sso");
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");
  const [jwt, setJwt] = useState("");

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-seal text-lg font-black text-white">SD</div>
          <h1 className="text-xl font-bold text-white">Sovereign Dispatch</h1>
          <p className="mt-1 text-sm text-white/50">Institutional publication infrastructure</p>
        </div>

        <div className="mb-4 flex rounded-lg border border-white/10 bg-ink-900/60 p-1 text-sm font-semibold">
          {(["sso", "service"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-1.5 transition ${mode === m ? "bg-seal text-white" : "text-white/50 hover:text-white"}`}>
              {m === "sso" ? "Single sign-on" : "Service client"}
            </button>
          ))}
        </div>

        {mode === "service" ? (
          <form onSubmit={(e) => { e.preventDefault(); signIn(clientId.trim(), secret).catch(() => {}); }}
            className="space-y-4 rounded-lg border border-white/10 bg-ink-800/60 p-6">
            <Field label="Client ID">
              <input className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="svc-…" autoFocus />
            </Field>
            <Field label="Secret">
              <input className={inputCls} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="••••••••" />
            </Field>
            {error && <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
            <Button type="submit" disabled={loading || !clientId || !secret} className="w-full">
              {loading ? "Authenticating…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); signInSso(jwt).catch(() => {}); }}
            className="space-y-4 rounded-lg border border-white/10 bg-ink-800/60 p-6">
            <Field label="Identity token (JWT)" hint="From your organisation's identity provider. Role and clearance are resolved from your Dispatch membership.">
              <textarea className={`${inputCls} h-28 font-mono text-xs`} value={jwt} onChange={(e) => setJwt(e.target.value)} placeholder="eyJhbGciOi…" autoFocus />
            </Field>
            {error && <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
            <Button type="submit" disabled={loading || !jwt.trim()} className="w-full">
              {loading ? "Verifying…" : "Continue"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-[11px] text-white/30">Sessions are held in memory and expire automatically.</p>
      </div>
    </div>
  );
};

export default SignIn;
