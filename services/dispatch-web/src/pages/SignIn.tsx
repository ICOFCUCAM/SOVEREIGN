import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { Button, Field, inputCls } from "../lib/ui";

// Client-credentials sign-in. The console authenticates with a Dispatch service
// client_id + secret (exchanged for a short-lived JWT). Human SSO (Supabase
// user JWT) plugs in here later without changing the rest of the app.
const SignIn: React.FC = () => {
  const { signIn, loading, error } = useAuth();
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-seal text-lg font-black text-white">SD</div>
          <h1 className="text-xl font-bold text-white">Sovereign Dispatch</h1>
          <p className="mt-1 text-sm text-white/50">Institutional publication infrastructure</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); signIn(clientId.trim(), secret).catch(() => {}); }}
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
        <p className="mt-4 text-center text-[11px] text-white/30">Sessions are held in memory and expire automatically.</p>
      </div>
    </div>
  );
};

export default SignIn;
