import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, KeyRound } from "lucide-react";

// Back-office login. Distinct from the public sign-in. Once authenticated,
// the BackOfficeShell loads the user's bo_user_profiles row and routes
// based on role. The first-ever signed-up user auto-promotes to superadmin
// via the bo_bootstrap_first_user trigger.

const BackOfficeLogin: React.FC = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "bootstrap">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) { nav("/back-office", { replace: true }); return null; }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      } else {
        if (password.length < 12) throw new Error("Password must be ≥ 12 characters.");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw new Error(error.message);
      }
      nav("/back-office", { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="h-9 w-9 rounded bg-cyan-400/15 ring-1 ring-cyan-400/30 flex items-center justify-center font-mono text-[11px] text-cyan-300 font-bold">BO</div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-white font-bold text-base tracking-tight">SOVEREIGN</span>
              <span className="text-cyan-400/60 text-[10px] tracking-[0.24em] font-mono">BACK OFFICE</span>
            </div>
          </div>
          <h1 className="font-bold text-2xl mt-6">{mode === "signin" ? "Officer sign-in" : "Bootstrap superadmin"}</h1>
          <p className="mt-2 text-sm text-white/55">
            {mode === "signin"
              ? "Restricted to provisioned officers."
              : "The first user to sign up becomes superadmin. Use this only on a fresh installation."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-lg border border-white/10 bg-black/40 p-6">
          {mode === "bootstrap" && (
            <Field label="Full name" icon={<Mail size={14} />}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-transparent outline-none text-sm"
                placeholder="Jane Founder"
              />
            </Field>
          )}
          <Field label="Email" icon={<Mail size={14} />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent outline-none text-sm"
              placeholder="officer@sovereigndo.com"
            />
          </Field>
          <Field label="Password" icon={<KeyRound size={14} />}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent outline-none text-sm"
              placeholder={mode === "bootstrap" ? "≥ 12 characters" : "••••••••"}
            />
          </Field>

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm py-2.5 transition disabled:opacity-50"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create superadmin"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "bootstrap" : "signin"); setError(null); }}
              className="text-[11px] uppercase tracking-[0.18em] text-cyan-400/70 hover:text-cyan-300"
            >
              {mode === "signin" ? "Bootstrap first user →" : "← Back to sign-in"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-[11px] text-white/35 flex items-center justify-center gap-1.5">
          <Lock size={11} /> RLS-enforced · service-role isolated
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">{label}</span>
    <div className="mt-1.5 flex items-center gap-2 rounded-md border border-white/15 bg-black/40 px-3 py-2 focus-within:border-cyan-400/60">
      <span className="text-white/40">{icon}</span>
      {children}
    </div>
  </label>
);

export default BackOfficeLogin;
