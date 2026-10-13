
// ── EXITOS → SOVEREIGN DISPATCH CLIENT ──────────────────────────────
// Renders a saved document version to PDF through Sovereign Dispatch. The
// browser calls our own edge function (exit-dispatch-submit) with the user's
// token and a version id; the function holds the Dispatch credentials. If
// Dispatch isn't deployed or configured it says so and never pretends a PDF
// was produced.

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://qvjdivcdefuprnenedje.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";

export const DISPATCH_SUBMIT_ENDPOINT = `${SUPABASE_URL}/functions/v1/exit-dispatch-submit`;

export interface DispatchSubmitResult {
  ok: boolean;
  configured: boolean;
  documentId?: string;
  jobId?: string;
  status?: string;
  error?: string;
}

/** Ask Dispatch (through the ExitOS bridge) to render one of the signed-in user's own
 *  saved versions. The bridge loads the version under the user's token and checks its
 *  content hash; the browser never sends document content or holds Dispatch credentials. */
export async function renderVersionPdf(versionId: string, accessToken: string): Promise<DispatchSubmitResult> {
  try {
    const res = await fetch(DISPATCH_SUBMIT_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ versionId, outputs: ["pdf"] }),
    });
    const j = await res.json().catch(() => ({}));
    if (j?.configured === false) return { ok: false, configured: false, error: j?.error ?? "PDF rendering is not connected" };
    if (!res.ok) return { ok: false, configured: true, error: (j?.error?.message ?? j?.error ?? `Dispatch returned ${res.status}`) as string };
    return { ok: true, configured: true, documentId: j?.documentId, jobId: j?.jobId, status: j?.status };
  } catch (e) {
    return { ok: false, configured: false, error: e instanceof Error ? e.message : "Dispatch unreachable" };
  }
}
