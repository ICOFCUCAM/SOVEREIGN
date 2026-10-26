import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout, { GradientText } from "@/components/auth/AuthLayout";
import { friendlyAuthError } from "@/lib/auth-errors";

// /reset-password — where the emailed reset link lands. The Supabase client reads
// the recovery token from the URL and opens a short-lived recovery session; only
// with that session can a new password be set. Without one (an old, used or
// mistyped link) the page says so and offers a fresh link.
const MIN = 6;

const ResetPassword = () => {
  const nav = useNavigate();
  const [state, setState] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // An expired or used link comes back with the error in the fragment.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error") || hash.get("error_code")) { setState("invalid"); return; }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setState((s) => (s === "checking" ? "ready" : s));
    });
    // Give the client a moment to exchange the token in the URL before deciding.
    const t = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setState((s) => (s === "checking" ? (data.session ? "ready" : "invalid") : s));
    }, 1200);
    return () => { sub.subscription.unsubscribe(); window.clearTimeout(t); };
  }, []);

  const tooShort = pw.length > 0 && pw.length < MIN;
  const mismatch = pw2.length > 0 && pw !== pw2;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < MIN || pw !== pw2) return;
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (err) { setError(friendlyAuthError(err.message)); return; }
    setState("done");
    window.setTimeout(() => nav("/dashboard", { replace: true }), 1400);
  };

  return (
    <AuthLayout eyebrow="Account recovery" headline={<>Choose a <GradientText>new password</GradientText></>}
      lede="Your documents, books and drafts are exactly where you left them.">
      {state === "checking" && (
        <p role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking your reset link…</p>
      )}

      {state === "invalid" && (
        <>
          <h2 className="font-serif text-3xl font-bold tracking-tight">This link has expired</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Reset links work once and only for a short time. Request a new one from the sign-in page and use the newest email.</p>
          <Button asChild className="mt-7 h-11 w-full rounded-full bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] font-semibold text-white">
            <Link to="/dashboard">Go to sign-in <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </>
      )}

      {state === "done" && (
        <div role="status">
          <h2 className="font-serif text-3xl font-bold tracking-tight">Password updated</h2>
          <p className="mt-2 text-sm text-muted-foreground">You're signed in. Taking you to your dashboard…</p>
        </div>
      )}

      {state === "ready" && (
        <>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Set a new password</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">You'll use it the next time you sign in.</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input id="new-password" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)}
                  required minLength={MIN} autoFocus aria-invalid={tooShort || undefined} className="h-11 pr-11" />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">At least {MIN} characters.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password-2">Repeat it</Label>
              <Input id="new-password-2" type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)}
                required aria-invalid={mismatch || undefined} className="h-11" />
            </div>
            {(tooShort || mismatch) && <p role="alert" className="text-sm text-destructive">{tooShort ? `Use at least ${MIN} characters.` : "The two passwords don't match."}</p>}
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || pw.length < MIN || pw !== pw2}
              className="h-11 w-full rounded-full bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] text-[15px] font-semibold text-white shadow-[0_12px_32px_-12px_hsl(248_83%_55%/0.7)] hover:opacity-95">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
