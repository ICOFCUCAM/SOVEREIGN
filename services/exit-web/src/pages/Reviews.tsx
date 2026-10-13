import React, { useEffect, useMemo, useState } from "react";
import { claimCompetence, claimValue, cleanStory, verificationState, type ClaimKey, type CompanyStory, type Competence, type Verification } from "@exit/engines";
import { useAuth } from "../lib/auth";
import { useDocumentRemote } from "../lib/documents/remote";
import { listEngagements, myAuthorizations, storyForReview, recordVerification, revokeVerification, fetchVerifications, type Authorization, type Engagement } from "../lib/verifications";
import { PageHeader, Section } from "../components/xo";

// ── VERIFICATION REVIEWS (authorised reviewers) ─────────────────────
// For a professional reviewer ExitOS has authorised for a competence. They see
// the companies that have engaged them, the claims within their competence with
// the value each company has stated, and record a verification with the evidence
// they reviewed, its scope, limitations and expiry. The server refuses anything
// else: another competence, a company that has not engaged them, their own
// company, a verification without evidence or scope.

const INPUT = "w-full rounded-sm border border-xo-line bg-xo-ink px-2.5 py-1.5 text-[13px] text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const LABEL = "mb-1 block text-[12px] font-medium text-xo-muted";
const BTN = "rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";

const FIGURE: Record<string, string> = { ttmRevenueUsd: "Revenue (TTM)", arrUsd: "ARR", growthPct: "ARR growth", grossMarginPct: "Gross margin", ebitdaMarginPct: "EBITDA margin", netRetentionPct: "Net revenue retention", customerConcentrationPct: "Top-ten customer share", totalCustomers: "Customers" };

/** The claims in a story a reviewer of this competence may verify, with their current value. */
function claimsFor(st: CompanyStory, competence: Competence): Array<{ claim: ClaimKey; label: string; value: unknown }> {
  const c = cleanStory(st);
  const all: Array<{ claim: ClaimKey; label: string }> = [
    ...Object.keys(c.figures ?? {}).map((k) => ({ claim: `figure:${k}` as ClaimKey, label: FIGURE[k] ?? k })),
    ...(c.financials?.annual ?? []).map((a) => ({ claim: `annual:${a.period}` as ClaimKey, label: `Financials ${a.period}` })),
    ...(c.market?.estimates ?? []).map((e) => ({ claim: `market:${e.label}` as ClaimKey, label: `Market size: ${e.label}` })),
    ...(c.customers?.grossRetentionPct != null ? [{ claim: "retention:gross" as ClaimKey, label: "Gross revenue retention" }] : []),
    ...(c.capitalization?.holders.length ? [{ claim: "cap" as ClaimKey, label: "Capitalisation table" }] : []),
  ];
  return all.filter((x) => claimCompetence(x.claim).includes(competence)).map((x) => ({ ...x, value: claimValue(c, x.claim) }));
}
const show = (v: unknown): string => (typeof v === "number" ? (Math.abs(v) < 5 ? `${Math.round(v * 1000) / 10}%` : v.toLocaleString("en-US")) : JSON.stringify(v));

const Reviews: React.FC = () => {
  const { session } = useAuth();
  const remote = useDocumentRemote();
  const me = session?.verified?.userId ?? null;
  const [auths, setAuths] = useState<Authorization[]>([]);
  const [eng, setEng] = useState<Engagement[]>([]);
  const [sel, setSel] = useState<Engagement | null>(null);
  const [story, setStory] = useState<CompanyStory | null>(null);
  const [mine, setMine] = useState<Verification[]>([]);
  const [form, setForm] = useState({ claim: "", evidence: "", scope: "", limitations: "", revalidate: "", expires: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!remote) return;
    void myAuthorizations(remote).then(setAuths).catch(() => setAuths([]));
    void listEngagements(remote).then((x) => setEng(x.filter((e) => e.reviewer_account_id === me && !e.revoked_at))).catch(() => setEng([]));
  }, [remote, me]);
  useEffect(() => {
    if (!remote || !sel) return;
    void storyForReview(sel.owner_account_id, sel.company_id, remote).then(setStory);
    void fetchVerifications(sel.company_id, remote).then((x) => setMine(x)).catch(() => setMine([]));
  }, [remote, sel]);
  const claims = useMemo(() => (story && sel ? claimsFor(story, sel.competence) : []), [story, sel]);

  if (!remote) return (
    <div data-page="reviews" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Verification reviews" title="Verification reviews" />
      <Section title="Sign in" className="border border-xo-line"><p className="px-4 py-3 text-[13px] text-xo-muted">Verification is recorded under a signed-in, authorised reviewer account. Sign in with your e-mail.</p></Section>
    </div>
  );

  const authorised = auths.filter((a) => !a.expires_at || new Date(a.expires_at) > new Date());
  return (
    <div data-page="reviews" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Verification reviews" title="Verification reviews">
        <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-xo-muted">Record what you have independently checked, within your authorised competence, for a company that has engaged you. Each verification names the evidence you reviewed and its scope and limitations. It stops counting if the company changes the figure, when it expires, or if you withdraw it.</p>
      </PageHeader>
      <Section title="Your authorisations" className="border border-xo-line">
        <div className="px-4 py-3 text-[12px] text-xo-muted">
          {authorised.length === 0 ? "You are not authorised as a reviewer. Authorisation is granted by ExitOS for a competence; it cannot be self-assigned." :
            authorised.map((a) => <p key={a.competence}>{a.competence}: {a.reviewer_name}, {a.reviewer_role}{a.expires_at ? ` (until ${a.expires_at.slice(0, 10)})` : ""}</p>)}
        </div>
      </Section>
      {authorised.length > 0 && (
        <Section title="Companies that have engaged you" className="border border-xo-line">
          <ul className="divide-y divide-xo-line">
            {eng.length === 0 && <li className="px-4 py-3 text-[12px] text-xo-faint">None yet.</li>}
            {eng.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-4 py-2 text-[12px]">
                <span>{e.company_id} · {e.competence} review · since {e.granted_at.slice(0, 10)}</span>
                <button type="button" className={BTN} onClick={() => { setSel(e); setMsg(""); }}>Review</button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {sel && story && (
        <Section title={`Record a verification · ${sel.company_id}`} eyebrow={`${sel.competence} competence`} className="border border-xo-line">
          <div className="space-y-3 px-4 py-3">
            <label className="block" htmlFor="rv-claim"><span className={LABEL}>Claim</span>
              <select id="rv-claim" className={INPUT} value={form.claim} onChange={(e) => setForm({ ...form, claim: e.target.value })}>
                <option value="">— choose —</option>
                {claims.map((c) => <option key={c.claim} value={c.claim}>{c.label}: {show(c.value)}</option>)}
              </select></label>
            <label className="block" htmlFor="rv-ev"><span className={LABEL}>Evidence reviewed (one item per line, required)</span>
              <textarea id="rv-ev" rows={3} className={INPUT} value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} /></label>
            <label className="block" htmlFor="rv-scope"><span className={LABEL}>Scope (required)</span><input id="rv-scope" className={INPUT} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="e.g. ARR at 30 September 2026, from the contract register" /></label>
            <label className="block" htmlFor="rv-lim"><span className={LABEL}>Limitations</span><input id="rv-lim" className={INPUT} value={form.limitations} onChange={(e) => setForm({ ...form, limitations: e.target.value })} /></label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block" htmlFor="rv-rev"><span className={LABEL}>Revalidate when</span><input id="rv-rev" className={INPUT} value={form.revalidate} onChange={(e) => setForm({ ...form, revalidate: e.target.value })} placeholder="e.g. at the next month-end close" /></label>
              <label className="block" htmlFor="rv-exp"><span className={LABEL}>Valid until (YYYY-MM-DD)</span><input id="rv-exp" className={INPUT} value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></label>
            </div>
            <button type="button" className={BTN} disabled={!form.claim} onClick={() => void (async () => {
              try {
                await recordVerification({ ownerId: sel.owner_account_id, companyId: sel.company_id, claim: form.claim as ClaimKey, competence: sel.competence, scope: form.scope,
                  evidence: form.evidence.split("\n").map((d) => d.trim()).filter(Boolean).map((description) => ({ description })),
                  ...(form.limitations ? { limitations: form.limitations } : {}), ...(form.revalidate ? { revalidateWhen: form.revalidate } : {}),
                  ...(form.expires ? { expiresAt: new Date(form.expires).toISOString() } : {}) }, remote);
                setMsg("Verification recorded."); setForm({ claim: "", evidence: "", scope: "", limitations: "", revalidate: "", expires: "" });
                setMine(await fetchVerifications(sel.company_id, remote));
              } catch (e) { setMsg(e instanceof Error ? e.message : "The verification was not recorded"); }
            })()}>Record verification</button>
            {msg && <p role="status" className="text-[12px] text-xo-muted">{msg}</p>}
            {mine.length > 0 && (
              <ul className="space-y-1 border-t border-xo-line pt-2 text-[12px]">
                {mine.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center gap-2">{v.claim} · {v.verifiedAt.slice(0, 10)} · {verificationState(v, story)}
                    {!v.revokedAt && <button type="button" className={BTN} onClick={() => void revokeVerification(v.id, "withdrawn by the reviewer", remote).then(async () => setMine(await fetchVerifications(sel.company_id, remote)))}>Withdraw</button>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      )}
    </div>
  );
};

export default Reviews;
