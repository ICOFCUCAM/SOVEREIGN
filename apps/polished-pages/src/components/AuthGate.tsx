import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppShell from "@/components/app/AppShell";
import { BRAND } from "@/lib/tools";

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

  if (loading) return null;
  if (!session) return <SignIn />;
  return <AppShell email={session.user.email ?? ""}>{children}</AppShell>;
};

const SignIn = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      // Tag the signup so the SOVEREIGN project's institutional triggers skip
      // it — Polished Pages users stay out of user_roles / bo_user_profiles.
      : await supabase.auth.signUp({ email, password, options: { data: { app: "polished_pages" } } });
    if (error) setMsg(error.message);
    else if (mode === "signup") setMsg("Account created. If email confirmation is on, confirm it, then sign in.");
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
          <p className="text-sm text-muted-foreground">{BRAND} — your document studio</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }}
            className="mt-4 text-sm text-muted-foreground underline underline-offset-2"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthGate;
