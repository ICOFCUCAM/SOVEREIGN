import type { DdmDocument } from "./dispatch-ddm";

// ── EXITOS → SOVEREIGN DISPATCH CLIENT ──────────────────────────────
// Submits an ExitOS document into the Sovereign Dispatch publication pipeline.
// The Dispatch service credentials are NEVER in the browser: the browser calls
// our own edge function (exit-dispatch-submit), which holds the client_id/secret
// and the Dispatch API URL, exchanges them for a short-lived JWT, and POSTs the
// document. Honest: if Dispatch isn't configured/reachable, it says so and never
// pretends a submission succeeded.

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://qvjdivcdefuprnenedje.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";

export const DISPATCH_SUBMIT_ENDPOINT = `${SUPABASE_URL}/functions/v1/exit-dispatch-submit`;
const HEADERS = { "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" };

export interface DispatchSubmitResult {
  ok: boolean;
  configured: boolean;
  documentId?: string;
  jobId?: string;
  lifecycleState?: string;
  status?: string;
  error?: string;
}

/** Submit a DDM document to Dispatch via the ExitOS edge function. */
export async function submitToDispatch(document: DdmDocument, outputs: string[] = ["pdf"]): Promise<DispatchSubmitResult> {
  try {
    const res = await fetch(DISPATCH_SUBMIT_ENDPOINT, {
      method: "POST", headers: HEADERS,
      body: JSON.stringify({ document, outputs }),
    });
    const j = await res.json().catch(() => ({}));
    if (j?.configured === false) return { ok: false, configured: false, error: j?.error ?? "Dispatch is not configured" };
    if (!res.ok) return { ok: false, configured: true, error: (j?.error?.message ?? j?.error ?? `Dispatch returned ${res.status}`) as string };
    return {
      ok: true, configured: true,
      documentId: j?.documentId ?? j?.id, jobId: j?.jobId, lifecycleState: j?.lifecycleState, status: j?.status,
    };
  } catch (e) {
    return { ok: false, configured: false, error: e instanceof Error ? e.message : "Dispatch unreachable" };
  }
}
