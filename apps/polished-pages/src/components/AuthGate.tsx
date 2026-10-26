import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import RouteFallback from "@/components/RouteFallback";
import AuthLayout, { GradientText } from "@/components/auth/AuthLayout";
import { BRAND, TOOLS } from "@/lib/tools";
import { friendlyAuthError } from "@/lib/auth-errors";

// Polished Pages generation is metered per user, so the studio sits behind a
// sign-in gate. This wraps the whole app: no session → sign-in screen; session →
// the full studio shell (global nav, command palette, account menu).
const AuthGate = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <RouteFallback />;
  if (!session) return <SignIn />;
  return <AppShell email={session.user.email ?? ""}>{children}</AppShell>;
};

type Mode = "signin" | "signup" | "forgot";

const HEADINGS: Record<Mode, { title: string; line: string }> = {
  signin: { title: "Welcome back", line: "Sign in to your studio." },
  signup: { title: "Create your account", line: "Free to start. No card required." },
  forgot: { title: "Reset your password", line: "We'll email you a link to choose a new one." },
};

const SignIn = () => {
  const { pathname } = useLocation();
  const tool = TOOLS.find((t) => t.path === pathname);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const go = (m: Mode) => { setMode(m); setError(null); setNotice(null); };

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    const addr = email.trim();
    if (mode === "forgot") {
      const { error: err } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: `${window.location.origin}/reset-password` });
      // The same answer whether or not the address has an account, so the form
      // never reveals who is registered. Only transport errors are shown.
      if (err && /fetch|network|rate limit|too many/i.test(err.message)) setError(friendlyAuthError(err.message));
      else setNotice(`If an account exists for ${addr}, a reset link is on its way. It works once and expires soon.`);
      setBusy(false);
      return;
    }
    const { data, error: err } = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email: addr, password })
      // Tag the signup so the SOVEREIGN project's institutional triggers skip
      // it — Polished Pages users stay out of user_roles / bo_user_profiles.
      : await supabase.auth.signUp({ email: addr, password, options: { data: { app: "polished_pages" }, emailRedirectTo: window.location.href } });
    if (err) setError(friendlyAuthError(err.message));
    else if (mode === "signup" && !data.session) { setNotice(`Check ${addr} for a confirmation link, then sign in.`); setMode("signin"); setPassword(""); }
    setBusy(false);
  };

  const h = HEADINGS[mode];
  return (
    <AuthLayout
      eyebrow={tool ? `Continue to ${tool.name}` : "Your studio"}
      headline={tool ? <>Sign in to open <GradientText>{tool.name}</GradientText></> : <>Everything you create, <GradientText>in one studio</GradientText></>}
      lede={tool ? tool.description : "CVs, books, storybooks, workbooks and curricula: created, localized, published and sold from one place."}
    >
      <h2 className="font-serif text-3xl font-bold tracking-tight">{h.title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{h.line}</p>

      {mode !== "forgot" && (
        <div role="tablist" aria-label="Sign in or create an account" className="mt-7 grid grid-cols-2 rounded-full border border-border bg-muted/50 p-1 text-sm font-medium">
          {(["signin", "signup"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => go(m)}
              className={`rounded-full px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" className="h-11" />
        </div>
        {mode !== "forgot" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "signin" && (
                <button type="button" onClick={() => go("forgot")} className="text-xs font-medium text-primary underline-offset-2 hover:underline">Forgot password?</button>
              )}
            </div>
            <div className="relative">
              <Input id="password" type={show ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11 pr-11" />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "signup" && <p className="text-xs text-muted-foreground">At least 6 characters. A short sentence is easy to remember and hard to guess.</p>}
          </div>
        )}

        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-primary/25 bg-primary/5 px-3.5 py-2.5 text-sm text-foreground">{notice}</p>}

        <Button type="submit" disabled={busy}
          className="h-11 w-full rounded-full bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] text-[15px] font-semibold text-white shadow-[0_12px_32px_-12px_hsl(248_83%_55%/0.7)] hover:opacity-95">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      {mode === "forgot" ? (
        <button type="button" onClick={() => go("signin")} className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </button>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          {mode === "signin" ? "New to " + BRAND + "? " : "Already have an account? "}
          <button type="button" onClick={() => go(mode === "signin" ? "signup" : "signin")} className="font-medium text-primary underline-offset-2 hover:underline">
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      )}
    </AuthLayout>
  );
};

export default AuthGate;
