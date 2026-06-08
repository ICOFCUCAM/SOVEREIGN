import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { Button, Field, inputCls } from "../lib/ui";
import { ROLE_LABEL, type Role, type Plan } from "../lib/access";

const ROLES: Role[] = ["founder", "buyer", "admin", "superadmin"];

const SignIn: React.FC = () => {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("founder");
  const [plan, setPlan] = useState<Plan>("free");

  const showPlan = role === "founder" || role === "buyer";

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-deal-400 to-deal-700 text-lg font-black text-white shadow-lg shadow-deal-700/30">EX</div>
          <h1 className="text-xl font-bold text-white">ExitOS</h1>
          <p className="mt-1 text-sm text-white/50">The operating system for company exits</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); signIn(email.trim(), password, role, plan).catch(() => {}); }}
          className="space-y-4 rounded-lg border border-white/10 bg-ink-800/60 p-6"
        >
          <Field label="Email">
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus />
          </Field>
          <Field label="Password">
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Account type</span>
            <div className="grid grid-cols-4 gap-1 rounded-md border border-white/10 bg-ink-900/60 p-1">
              {ROLES.map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`rounded px-1 py-1.5 text-[11px] font-semibold transition ${role === r ? "bg-deal-600/30 text-white" : "text-white/55 hover:text-white"}`}>
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          {showPlan && (
            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Plan</span>
              <div className="grid grid-cols-2 gap-1 rounded-md border border-white/10 bg-ink-900/60 p-1">
                {(["free", "pro"] as Plan[]).map((p) => (
                  <button key={p} type="button" onClick={() => setPlan(p)}
                    className={`rounded px-2 py-1.5 text-[11px] font-semibold uppercase transition ${plan === p ? "bg-deal-600/30 text-white" : "text-white/55 hover:text-white"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
          <Button type="submit" disabled={loading || !email || !password} className="w-full">
            {loading ? "Authenticating…" : "Open console"}
          </Button>
        </form>
        <p className="mt-4 text-center text-[11px] text-white/30">
          Demo: pick an account type and plan to explore each experience. Free founders/buyers can watch; Pro unlocks the Chief Investment Banker and the full desk. Sessions are in-memory.
        </p>
      </div>
    </div>
  );
};

export default SignIn;
