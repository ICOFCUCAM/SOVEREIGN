import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { Button, Field, inputCls } from "../lib/ui";

const SignIn: React.FC = () => {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-deal-400 to-deal-700 text-lg font-black text-white shadow-lg shadow-deal-700/30">EX</div>
          <h1 className="text-xl font-bold text-white">ExitOS</h1>
          <p className="mt-1 text-sm text-white/50">The operating system for company exits</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); signIn(email.trim(), password).catch(() => {}); }}
          className="space-y-4 rounded-lg border border-white/10 bg-ink-800/60 p-6"
        >
          <Field label="Founder email">
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@founder.org" autoFocus />
          </Field>
          <Field label="Password">
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          {error && <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
          <Button type="submit" disabled={loading || !email || !password} className="w-full">
            {loading ? "Authenticating…" : "Open console"}
          </Button>
        </form>
        <p className="mt-4 text-center text-[11px] text-white/30">
          Sessions are held in memory and expire automatically. ExitOS auth wires through Sovereign SSO once the production API ships.
        </p>
      </div>
    </div>
  );
};

export default SignIn;
