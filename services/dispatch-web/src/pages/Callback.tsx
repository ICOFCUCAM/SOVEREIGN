import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeLogin } from "../lib/oauth";
import { useAuth } from "../lib/auth";

// OAuth redirect landing (/console/callback). Completes the PKCE exchange via
// the API, establishes the session, then routes into the console. On failure it
// shows the reason with a way back to sign-in.
const Callback: React.FC = () => {
  const nav = useNavigate();
  const { signInWithSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false); // guard StrictMode double-invoke (code is single-use)

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const r = await completeLogin(window.location.search);
        signInWithSession(r);
        nav("/console", { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "sign-in failed");
      }
    })();
  }, [nav, signInWithSession]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4 text-center">
      {error ? (
        <div className="max-w-sm">
          <div className="mb-3 text-sm font-semibold text-red-300">Sign-in failed</div>
          <p className="mb-5 text-sm text-white/50">{error}</p>
          <button onClick={() => nav("/console", { replace: true })} className="rounded-md bg-seal px-4 py-2 text-sm font-semibold text-white hover:bg-seal-light">Back to sign-in</button>
        </div>
      ) : (
        <div className="text-sm text-white/50">Completing sign-in…</div>
      )}
    </div>
  );
};

export default Callback;
