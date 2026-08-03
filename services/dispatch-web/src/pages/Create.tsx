import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { track } from "../lib/analytics";
import { submitDocument, validateDocument, getGovernancePolicies, assistField, DispatchError, type ApiError, type GovernancePolicy, humanError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useBilling, UsageBanner, UpgradeModal } from "../lib/upsell";
import { Button, Card, Field, inputCls, ClassBadge } from "../lib/ui";
import { GovernanceInstrument } from "../components/GovernanceInstrument";

// CREATE — the institutional authoring department. Unlike Submit (raw DDM JSON),
// this composes a valid DDM document from structured forms per document type, so
// an author can produce any of the institutional document kinds without writing
// JSON. The output flows through the same Submit → Approve → Render → Publish
// pipeline. Each DOC_TYPES entry mirrors a scaffold profile (requiredRoles +
// blockPolicy) in packages/ddm-schema, so the composed document validates.
// (Consumer document generation — CV/letter/book — lives in the separate
// Polished Pages studio, by design.)

type Kind = "paragraph" | "bullets" | "callout" | "timeline";
type CalloutStyle = "info" | "warning" | "risk" | "recommendation";
interface FieldSpec { role: string; heading: string; kind: Kind; placeholder: string; lead?: boolean; calloutStyle?: CalloutStyle }
interface DocTypeSpec { docType: string; label: string; blurb: string; fields: FieldSpec[] }

const DOC_TYPES: DocTypeSpec[] = [
  {
    docType: "executive_briefing", label: "Executive Briefing",
    blurb: "Bottom line up front, key judgements, analysis, recommendation.",
    fields: [
      { role: "executive_summary", heading: "Executive Summary", kind: "paragraph", lead: true, placeholder: "Bottom line up front — the single most important thing the principal must know." },
      { role: "key_judgements", heading: "Key Judgements", kind: "bullets", placeholder: "One judgement per line." },
      { role: "analysis", heading: "Analysis", kind: "paragraph", placeholder: "The supporting analysis behind the judgements." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", placeholder: "The recommended course of action." },
    ],
  },
  {
    docType: "board_report", label: "Board Report",
    blurb: "Summary, performance, decisions requested, risks, recommendation.",
    fields: [
      { role: "executive_summary", heading: "Executive Summary", kind: "paragraph", lead: true, placeholder: "The headline for the board." },
      { role: "performance", heading: "Performance", kind: "paragraph", placeholder: "Performance against plan since the last meeting." },
      { role: "decisions", heading: "Decisions Requested", kind: "bullets", placeholder: "One decision the board must take, per line." },
      { role: "risks", heading: "Risks", kind: "bullets", placeholder: "One material risk per line." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", placeholder: "What you are asking the board to approve." },
    ],
  },
  {
    docType: "policy_paper", label: "Policy Paper",
    blurb: "Summary, problem, evidence, options analysis, recommendation.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "A one-paragraph summary of the policy position." },
      { role: "problem", heading: "Problem", kind: "paragraph", placeholder: "The problem this policy addresses." },
      { role: "evidence", heading: "Evidence", kind: "bullets", placeholder: "One evidence point per line." },
      { role: "options_analysis", heading: "Options Analysis", kind: "paragraph", placeholder: "Analysis of the options considered." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", placeholder: "The recommended policy option." },
    ],
  },
  {
    docType: "situation_report", label: "Situation Report",
    blurb: "Current status, timeline of events, impacts, next update.",
    fields: [
      { role: "current_status", heading: "Current Status", kind: "paragraph", lead: true, placeholder: "The current state of the situation, bottom line up front." },
      { role: "timeline", heading: "Timeline", kind: "timeline", placeholder: "0900Z | First report received | optional detail\n1030Z | Response team deployed" },
      { role: "impacts", heading: "Impacts", kind: "bullets", placeholder: "One impact per line." },
      { role: "next_update", heading: "Next Update", kind: "paragraph", placeholder: "When the next update will be issued, and by whom." },
    ],
  },
  {
    docType: "intelligence_briefing", label: "Intelligence Briefing",
    blurb: "Bottom line, key judgements, assessment, outlook.",
    fields: [
      { role: "bottom_line", heading: "Bottom Line", kind: "callout", calloutStyle: "info", placeholder: "The single most decision-relevant judgement." },
      { role: "key_judgements", heading: "Key Judgements", kind: "bullets", placeholder: "One judgement per line (with confidence where known)." },
      { role: "assessment", heading: "Assessment", kind: "paragraph", placeholder: "The analytic line supporting the judgements." },
      { role: "outlook", heading: "Outlook", kind: "paragraph", placeholder: "What to expect next and indicators to watch." },
    ],
  },
  {
    docType: "ministerial_report", label: "Ministerial Report",
    blurb: "Summary, issue, considerations, recommendation.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "What the Minister needs to know in one paragraph." },
      { role: "issue", heading: "Issue", kind: "paragraph", placeholder: "The matter requiring the Minister's attention or decision." },
      { role: "considerations", heading: "Considerations", kind: "bullets", placeholder: "One consideration per line (policy, legal, financial, presentational)." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", placeholder: "What the Minister is being asked to agree." },
    ],
  },
  {
    docType: "strategic_memorandum", label: "Strategic Memorandum",
    blurb: "Purpose, situation, analysis, recommendation.",
    fields: [
      { role: "purpose", heading: "Purpose", kind: "paragraph", lead: true, placeholder: "Why this memorandum exists and the decision it serves." },
      { role: "situation", heading: "Situation", kind: "paragraph", placeholder: "The strategic context and what has changed." },
      { role: "analysis", heading: "Analysis", kind: "paragraph", placeholder: "The strategic analysis and its implications." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", placeholder: "The recommended strategic course of action." },
    ],
  },
  {
    docType: "regulatory_response", label: "Regulatory Response",
    blurb: "Summary, matters raised, response, remediation.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "A one-paragraph summary of the response." },
      { role: "matters_raised", heading: "Matters Raised", kind: "bullets", placeholder: "One matter / question raised by the regulator per line." },
      { role: "response", heading: "Response", kind: "paragraph", placeholder: "The substantive response to the matters raised." },
      { role: "remediation", heading: "Remediation & Commitments", kind: "callout", calloutStyle: "warning", placeholder: "The remediation steps and commitments, with dates." },
    ],
  },
  {
    docType: "research_dossier", label: "Research Dossier",
    blurb: "Abstract, scope, findings, conclusion.",
    fields: [
      { role: "abstract", heading: "Abstract", kind: "paragraph", lead: true, placeholder: "A short abstract of the research and its conclusion." },
      { role: "scope", heading: "Scope", kind: "paragraph", placeholder: "What the dossier covers and the questions it answers." },
      { role: "findings", heading: "Findings", kind: "bullets", placeholder: "One finding per line." },
      { role: "conclusion", heading: "Conclusion", kind: "paragraph", placeholder: "What the findings mean and their implications." },
    ],
  },
  {
    docType: "investor_update", label: "Investor Update",
    blurb: "Highlights, progress, metrics, asks.",
    fields: [
      { role: "highlights", heading: "Highlights", kind: "bullets", placeholder: "One headline highlight per line." },
      { role: "progress", heading: "Progress", kind: "paragraph", placeholder: "Progress since the last update." },
      { role: "metrics", heading: "Metrics", kind: "bullets", placeholder: "One key metric per line (e.g. MRR, growth, runway)." },
      { role: "asks", heading: "Asks", kind: "callout", calloutStyle: "info", placeholder: "How investors can help — intros, hires, advice." },
    ],
  },
  {
    docType: "proposal_package", label: "Proposal Package",
    blurb: "Executive summary, approach, deliverables, commercials.",
    fields: [
      { role: "executive_summary", heading: "Executive Summary", kind: "paragraph", lead: true, placeholder: "The proposition in one paragraph." },
      { role: "approach", heading: "Approach", kind: "paragraph", placeholder: "How the work will be done." },
      { role: "deliverables", heading: "Deliverables", kind: "bullets", placeholder: "One deliverable per line." },
      { role: "commercials", heading: "Commercials", kind: "callout", calloutStyle: "info", placeholder: "Pricing and commercial terms." },
    ],
  },
  {
    docType: "press_release", label: "Press Release",
    blurb: "Headline, lead, body, boilerplate.",
    fields: [
      { role: "headline", heading: "Headline", kind: "paragraph", placeholder: "The announcement in one strong line." },
      { role: "lead", heading: "Lead Paragraph", kind: "paragraph", lead: true, placeholder: "CITY, Date — the who/what/when/where/why in one paragraph." },
      { role: "body", heading: "Body", kind: "paragraph", placeholder: "Supporting detail, context, and a quote if available." },
      { role: "boilerplate", heading: "Boilerplate", kind: "paragraph", placeholder: "Standard “About [organisation]” paragraph." },
    ],
  },
  {
    docType: "meeting_minutes", label: "Meeting Minutes",
    blurb: "Attendees, discussion, decisions, actions.",
    fields: [
      { role: "attendees", heading: "Attendees", kind: "bullets", placeholder: "One attendee per line (name, role)." },
      { role: "discussion", heading: "Discussion", kind: "paragraph", placeholder: "Summary of what was discussed." },
      { role: "decisions", heading: "Decisions", kind: "bullets", placeholder: "One decision taken per line." },
      { role: "actions", heading: "Action Items", kind: "bullets", placeholder: "One action per line (owner — task — due date)." },
    ],
  },
  {
    docType: "risk_report", label: "Risk Report",
    blurb: "Summary, risk register, mitigations, recommendation.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "The overall risk position in one paragraph." },
      { role: "risk_register", heading: "Risk Register", kind: "bullets", placeholder: "One risk per line (risk — likelihood — impact)." },
      { role: "mitigations", heading: "Mitigations", kind: "paragraph", placeholder: "How the material risks are being mitigated." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", calloutStyle: "risk", placeholder: "What you are asking to be agreed on risk." },
    ],
  },
  {
    docType: "audit_report", label: "Audit Report",
    blurb: "Summary, scope, findings, recommendations.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "Overall audit opinion in one paragraph." },
      { role: "scope", heading: "Scope", kind: "paragraph", placeholder: "What was audited, the period, and the basis." },
      { role: "findings", heading: "Findings", kind: "bullets", placeholder: "One finding per line (with rating where used)." },
      { role: "recommendations", heading: "Recommendations", kind: "bullets", placeholder: "One recommendation per line." },
    ],
  },
  {
    docType: "due_diligence_report", label: "Due Diligence Report",
    blurb: "Summary, scope, findings, red flags, recommendation.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "The diligence conclusion in one paragraph." },
      { role: "scope", heading: "Scope", kind: "paragraph", placeholder: "What was examined and over what period." },
      { role: "findings", heading: "Findings", kind: "bullets", placeholder: "One finding per line." },
      { role: "red_flags", heading: "Red Flags", kind: "bullets", placeholder: "One material concern per line." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", calloutStyle: "warning", placeholder: "Proceed / proceed-with-conditions / do-not-proceed, and why." },
    ],
  },
  {
    docType: "white_paper", label: "White Paper",
    blurb: "Abstract, problem, approach, conclusion.",
    fields: [
      { role: "abstract", heading: "Abstract", kind: "paragraph", lead: true, placeholder: "A short abstract of the paper's argument." },
      { role: "problem", heading: "Problem", kind: "paragraph", placeholder: "The problem the paper addresses." },
      { role: "approach", heading: "Approach", kind: "paragraph", placeholder: "The proposed approach or solution." },
      { role: "conclusion", heading: "Conclusion", kind: "paragraph", placeholder: "What follows from the argument." },
    ],
  },
  {
    docType: "legislative_instrument", label: "Legislative Instrument",
    blurb: "Summary, preamble, provisions, commencement.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "What this instrument does, in one paragraph." },
      { role: "preamble", heading: "Preamble", kind: "paragraph", placeholder: "The enabling authority and the purpose for which it is exercised." },
      { role: "provisions", heading: "Provisions", kind: "bullets", placeholder: "One provision per line, in order." },
      { role: "commencement", heading: "Commencement", kind: "callout", calloutStyle: "info", placeholder: "When the instrument enters into force, and any transitional arrangements." },
    ],
  },
  {
    docType: "gazette_notice", label: "Gazette Notice",
    blurb: "Summary, issuing authority, notice body, effect.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "What this notice announces, in one paragraph." },
      { role: "issuing_authority", heading: "Issuing Authority", kind: "paragraph", placeholder: "The office under whose authority this notice is issued." },
      { role: "body", heading: "Notice", kind: "paragraph", placeholder: "The full text of the notice." },
      { role: "effect", heading: "Effect", kind: "callout", calloutStyle: "info", placeholder: "When and how the notice takes effect." },
    ],
  },
  {
    docType: "tender_notice", label: "Tender Notice",
    blurb: "Summary, scope, eligibility, submission requirements.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "The procurement in one paragraph — what is being purchased and why." },
      { role: "scope", heading: "Scope", kind: "paragraph", placeholder: "The scope of goods, works or services being procured." },
      { role: "eligibility", heading: "Eligibility", kind: "bullets", placeholder: "One eligibility requirement per line." },
      { role: "submission", heading: "Submission", kind: "callout", calloutStyle: "info", placeholder: "Deadline, channel and format for submissions." },
    ],
  },
  {
    docType: "contract_award", label: "Contract Award Decision",
    blurb: "Summary, evaluation, award decision, key terms.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "The procurement and its outcome, in one paragraph." },
      { role: "evaluation", heading: "Evaluation", kind: "paragraph", placeholder: "How submissions were evaluated against the published criteria." },
      { role: "decision", heading: "Award Decision", kind: "callout", placeholder: "The awarded supplier, the value, and the deciding authority." },
      { role: "terms", heading: "Key Terms", kind: "bullets", placeholder: "One key contractual term per line." },
    ],
  },
  {
    docType: "contract_record", label: "Contract Record",
    blurb: "Summary, parties, obligations, term.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "The agreement in one paragraph." },
      { role: "parties", heading: "Parties", kind: "bullets", placeholder: "One party per line, with its role in the agreement." },
      { role: "obligations", heading: "Obligations", kind: "paragraph", placeholder: "The principal obligations of each party." },
      { role: "term", heading: "Term", kind: "callout", calloutStyle: "info", placeholder: "Effective date, duration, renewal and termination terms." },
    ],
  },
  {
    docType: "court_judgment", label: "Court Judgment",
    blurb: "Case summary, background, reasoning, ruling.",
    fields: [
      { role: "case_summary", heading: "Case Summary", kind: "paragraph", lead: true, placeholder: "The case, the parties and the outcome, in one paragraph." },
      { role: "background", heading: "Background", kind: "paragraph", placeholder: "The facts and procedural history of the case." },
      { role: "reasoning", heading: "Reasoning", kind: "paragraph", placeholder: "The court's reasoning on the issues." },
      { role: "ruling", heading: "Ruling", kind: "callout", placeholder: "The operative ruling and orders of the court." },
    ],
  },
  {
    docType: "board_resolution", label: "Board Resolution",
    blurb: "Preamble, resolutions, voting, effect.",
    fields: [
      { role: "preamble", heading: "Preamble", kind: "paragraph", lead: true, placeholder: "The context in which the board resolves." },
      { role: "resolutions", heading: "Resolutions", kind: "bullets", placeholder: "One resolved item per line ('RESOLVED, that …')." },
      { role: "voting", heading: "Voting", kind: "paragraph", placeholder: "Votes for, against and abstentions, and quorum." },
      { role: "effect", heading: "Effect", kind: "callout", calloutStyle: "info", placeholder: "When the resolutions take effect and who executes them." },
    ],
  },
  {
    docType: "election_declaration", label: "Election Declaration",
    blurb: "Summary, results, formal declaration, objections.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "The election and what is being declared, in one paragraph." },
      { role: "results", heading: "Results", kind: "bullets", placeholder: "One candidate or option per line, with counts." },
      { role: "declaration", heading: "Declaration", kind: "callout", placeholder: "The formal declaration of the result, under the declaring authority." },
      { role: "objections", heading: "Objections", kind: "paragraph", placeholder: "The window and channel for objections or petitions." },
    ],
  },
  {
    docType: "public_notice", label: "Public Notice",
    blurb: "Summary, notice body, issuing authority, effect.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "What this notice announces, in one paragraph." },
      { role: "body", heading: "Notice", kind: "paragraph", placeholder: "The full text of the notice." },
      { role: "authority", heading: "Issuing Authority", kind: "paragraph", placeholder: "The office issuing this notice." },
      { role: "effective", heading: "Effect", kind: "callout", calloutStyle: "info", placeholder: "When the notice takes effect, and how to respond." },
    ],
  },
  {
    docType: "model_approval", label: "AI Model Approval",
    blurb: "Summary, intended use, risk assessment, approval decision.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "The AI system, its purpose and the decision, in one paragraph." },
      { role: "intended_use", heading: "Intended Use", kind: "paragraph", placeholder: "What the model or AI system may — and may not — be used for." },
      { role: "risk_assessment", heading: "Risk Assessment", kind: "bullets", placeholder: "One identified risk per line, with its mitigation." },
      { role: "decision", heading: "Approval Decision", kind: "callout", placeholder: "The approval decision, its conditions, and the review date." },
    ],
  },
];

const LEVELS = ["UNCLASSIFIED", "OFFICIAL", "OFFICIAL-SENSITIVE", "CONFIDENTIAL"];
const today = (): string => new Date().toISOString().slice(0, 10);

const Create: React.FC = () => {
  const { session } = useAuth();
  const nav = useNavigate();
  const [docTypeId, setDocTypeId] = useState(DOC_TYPES[0].docType);
  const spec = useMemo(() => DOC_TYPES.find((d) => d.docType === docTypeId)!, [docTypeId]);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("UNCLASSIFIED");
  const [values, setValues] = useState<Record<string, string>>({});
  const [outputs, setOutputs] = useState<string[]>(["pdf"]);
  const [validation, setValidation] = useState<{ valid: boolean; errors: ApiError[]; warnings: unknown[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const { billing, refresh, setBilling } = useBilling();
  const [upgrade, setUpgrade] = useState(false);
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  useEffect(() => { getGovernancePolicies().then((r) => setPolicies(r.policies)).catch(() => { /* non-fatal */ }); }, []);
  // Record-creation funnel: started on arrival, created on submit, abandoned if
  // the operator leaves the page before submitting their first record.
  const created = useRef(false);
  useEffect(() => {
    track("record.create.started");
    return () => { if (!created.current) track("record.create.abandoned"); };
  }, []);
  // The governance the record will inherit: the policy bound to this type whose
  // classification matches (a level-specific policy beats a type-wide one).
  const policy = useMemo(() => {
    const lvl = level.toLowerCase();
    return policies
      .filter((p) => p.docType === docTypeId && (!p.classificationLevel || p.classificationLevel.toLowerCase() === lvl))
      .sort((a, b) => (b.classificationLevel ? 1 : 0) - (a.classificationLevel ? 1 : 0))[0] ?? null;
  }, [policies, docTypeId, level]);

  const set = (role: string, v: string): void => { setValues((p) => ({ ...p, [role]: v })); setValidation(null); };

  const document = useMemo(() => {
    const sections = spec.fields.map((f, i) => {
      const v = (values[f.role] ?? "").trim();
      let block: Record<string, unknown>;
      if (f.kind === "bullets") block = { id: `b${i + 1}`, type: "bullets", ordered: false, items: v.split(/\n+/).map((s) => s.trim()).filter(Boolean).map((text) => ({ text })) };
      else if (f.kind === "callout") block = { id: `b${i + 1}`, type: "callout", style: f.calloutStyle ?? "recommendation", text: v };
      else if (f.kind === "timeline") block = { id: `b${i + 1}`, type: "timeline", events: v.split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => { const [ts, label, detail] = l.split("|").map((s) => s.trim()); return { ts: ts || "", label: label || ts || "", ...(detail ? { detail } : {}) }; }) };
      else block = { id: `b${i + 1}`, type: "paragraph", text: v, ...(f.lead ? { style: "lead" } : {}) };
      return { id: `s${i + 1}`, role: f.role, heading: f.heading, level: 1, blocks: [block] };
    });
    return { ddmVersion: "1.0", docType: spec.docType, metadata: { title: title.trim() || spec.label, date: today(), status: "final" }, classification: { scheme: "none", level }, sections };
  }, [spec, values, title, level]);

  const buildRequest = () => ({
    schemaVersion: "1.0",
    idempotencyKey: crypto.randomUUID(),
    source: { system: "saas-ui", tenantId: session!.tenantId },
    document,
    outputs,
    delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 },
  });

  const missing = spec.fields.filter((f) => !(values[f.role] ?? "").trim()).map((f) => f.heading);
  // AI authoring assist is a pre-governance drafting aid. It is disabled for
  // OFFICIAL-SENSITIVE and above so sensitive drafts are never sent to a model
  // (the server enforces the same guard authoritatively).
  const assistAllowed = !/SENSITIVE|CONFIDENTIAL|SECRET|RESTRICTED|COSMIC/i.test(level);

  const onValidate = async (): Promise<void> => {
    setErr(null); setValidation(null); setBusy(true);
    try { setValidation(await validateDocument(buildRequest())); }
    catch (e) { setErr(humanError(e, "validation failed")); }
    finally { setBusy(false); }
  };
  const onSubmit = async (): Promise<void> => {
    setErr(null); setBusy(true);
    try {
      const req = buildRequest();
      const r = await submitDocument(req, req.idempotencyKey);
      created.current = true;
      track("record.created");
      nav(`/console/documents/${r.documentId}`);
    }
    catch (e) {
      if (e instanceof DispatchError && e.status === 402) { setUpgrade(true); return; }
      setErr(humanError(e, "submit failed"));
    }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl">
      {upgrade && <UpgradeModal open reason="quota" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); refresh(); setUpgrade(false); }} />}
      <header className="mb-7">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-seal-light">Official Record</div>
        <h1 className="mt-1.5 font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">Create Official Record</h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-white/55">
          The front door to a governed publication system — not a document editor. Choose the record and see exactly how it
          will be governed, who must approve it, who may publish it, and the proof it produces, before you submit.
        </p>
      </header>
      {billing && <UsageBanner b={billing} onUpgrade={() => setUpgrade(true)} className="mb-6" />}
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* STEP 1 — define the record (type + classification drive its governance) */}
      <Step n="1" title="Define the record" sub="Type and classification determine the policy that will govern it." />
      <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">Record type</div>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {DOC_TYPES.map((d) => {
              const on = d.docType === docTypeId;
              return (
                <button key={d.docType} onClick={() => { setDocTypeId(d.docType); setValues({}); setValidation(null); }}
                  className={`group rounded-xl border p-3.5 text-left transition ${on ? "border-seal-light/60 bg-gradient-to-b from-seal/20 to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "border-white/10 bg-white/[0.015] hover:border-white/25 hover:bg-white/[0.03]"}`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-[13.5px] font-bold tracking-tight ${on ? "text-white" : "text-white/85"}`}>{d.label}</div>
                    {on && <span className="h-1.5 w-1.5 rounded-full bg-seal-light" aria-hidden />}
                  </div>
                  <div className="mt-1 text-[11.5px] leading-snug text-white/45">{d.blurb}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">Classification</div>
          <select className={inputCls} value={level} onChange={(e) => { setLevel(e.target.value); setValidation(null); }}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900/50 px-3 py-2.5">
            <ClassBadge level={level} />
            <span className="text-[11px] leading-snug text-white/40">Marked on the record; gates who may read and approve it.</span>
          </div>
        </div>
      </div>

      {/* STEP 2 — the governed publication procedure: the spine of the page */}
      <Step n="2" title="The publication procedure" sub="What happens after you submit — read from the policy bound to this record, not fabricated." />
      <div className="mb-8">
        <GovernanceInstrument docTypeLabel={spec.label} classification={level} policy={policy} outputs={outputs} />
      </div>

      {/* STEP 3 — author + submit */}
      <Step n="3" title="Author the content" sub="Structured authoring — no formatting, markup, or technical knowledge required." />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="space-y-4 p-5">
          <Field label="Title"><input className={inputCls} value={title} onChange={(e) => { setTitle(e.target.value); setValidation(null); }} placeholder={`${spec.label} title`} /></Field>
          {spec.fields.map((f) => (
            <Field key={f.role} label={f.heading} hint={f.kind === "bullets" ? "One item per line." : f.kind === "timeline" ? "One event per line: time | label | detail" : f.kind === "callout" ? "Shown as a highlighted callout." : undefined}>
              <textarea className={`${inputCls} ${f.kind === "bullets" || f.kind === "timeline" ? "h-24" : "h-20"} leading-relaxed`}
                value={values[f.role] ?? ""} onChange={(e) => set(f.role, e.target.value)} placeholder={f.placeholder} />
              <FieldAssist
                docType={spec.docType} heading={f.heading} kind={f.kind} value={values[f.role] ?? ""} classification={level} allowed={assistAllowed}
                onApply={(t) => set(f.role, t)}
                onInsert={(t) => set(f.role, (values[f.role] ? values[f.role] + "\n" : "") + t)}
              />
            </Field>
          ))}
        </Card>

        {/* submit rail */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="p-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Outputs</h3>
            <p className="mb-3 text-[11px] text-white/35">At least one format is required.</p>
            <div className="flex flex-wrap gap-2">
              {["pdf", "docx", "md"].map((o) => {
                const on = outputs.includes(o);
                return (
                  <button key={o} onClick={() => setOutputs((prev) => on ? prev.filter((x) => x !== o) : [...prev, o])}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide transition ${on ? "border-seal-light bg-seal/40 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" : "border-white/12 bg-white/[0.02] text-white/45 hover:text-white/70"}`}>
                    {on && <span className="text-emerald-300" aria-hidden>✓</span>}{o}
                  </button>
                );
              })}
            </div>
            {outputs.length === 0 && <p className="mt-2.5 text-[11px] text-amber-300/90">Select at least one output format to continue.</p>}
          </Card>

          {validation && (
            <Card className={`p-4 ${validation.valid ? "border-emerald-500/30" : "border-red-500/30"}`}>
              <div className={`text-sm font-semibold ${validation.valid ? "text-emerald-300" : "text-red-300"}`}>{validation.valid ? "✓ Valid — ready to submit" : "Validation errors"}</div>
              {validation.errors?.length > 0 && (
                <ul className="mt-2 space-y-1 text-[12px] text-red-300/90">{validation.errors.map((e, i) => <li key={i}>· {e.message}{e.field ? ` (${e.field})` : ""}</li>)}</ul>
              )}
            </Card>
          )}

          <Card className="p-4">
            {(missing.length > 0 || outputs.length === 0) && (
              <p className="mb-2.5 text-[12px] leading-snug text-amber-300/90">
                Still needed: {[...missing, ...(outputs.length === 0 ? ["an output format"] : [])].join(", ")}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onValidate} disabled={busy}>{busy ? "…" : "Validate"}</Button>
              <Button className="flex-1" onClick={onSubmit} disabled={busy || missing.length > 0 || outputs.length === 0}>{busy ? "Submitting…" : "Submit for governance →"}</Button>
            </div>
            <p className="mt-2.5 text-[11px] leading-snug text-white/35">Submitting enters the approval chain above. Nothing is published until the policy is satisfied.</p>
            <button onClick={() => setShowJson((s) => !s)} className="mt-2 text-[11px] uppercase tracking-wide text-white/25 hover:text-white/55">{showJson ? "Hide" : "Show"} technical payload</button>
          </Card>
        </div>
      </div>

      {showJson && (
        <Card className="mt-4 p-4">
          <pre className="max-h-80 overflow-auto font-mono text-[11px] leading-relaxed text-white/60">{JSON.stringify(document, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
};

// A numbered institutional step header — gives the page the cadence of a governed
// procedure rather than a single flat form.
const Step: React.FC<{ n: string; title: string; sub: string }> = ({ n, title, sub }) => (
  <div className="mb-3 flex items-baseline gap-3">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-seal/25 font-mono text-[12px] font-bold text-seal-light ring-1 ring-seal-light/30">{n}</span>
    <div>
      <h2 className="text-[15px] font-bold tracking-tight text-white">{title}</h2>
      <p className="text-[12px] text-white/45">{sub}</p>
    </div>
  </div>
);

// AI authoring assist — a drafting aid the author GOVERNS: it refines one field
// and returns a suggestion the author chooses to Replace, Insert, or Discard. It
// never overwrites silently and touches only the pre-governance draft. Disabled
// for sensitive classifications (drafts never leave the tenant; server enforces).
const INTENTS: { intent: "develop" | "polish" | "restructure" | "shorten"; label: string }[] = [
  { intent: "develop", label: "Develop" },
  { intent: "polish", label: "Polish" },
  { intent: "restructure", label: "Restructure" },
  { intent: "shorten", label: "Shorten" },
];
const FieldAssist: React.FC<{
  docType: string; heading: string; kind: string; value: string; classification: string; allowed: boolean;
  onApply: (text: string) => void; onInsert: (text: string) => void;
}> = ({ docType, heading, kind, value, classification, allowed, onApply, onInsert }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!allowed) {
    return <p className="mt-1.5 text-[11px] text-white/30">AI assist is off for {classification} — sensitive drafts never leave your tenant.</p>;
  }

  const run = async (intent: "develop" | "polish" | "restructure" | "shorten") => {
    if (!value.trim()) { setErr("Write a line first, then refine it."); setSuggestion(null); return; }
    setBusy(intent); setErr(null); setSuggestion(null);
    try {
      const r = await assistField({ docType, fieldHeading: heading, kind, intent, text: value, classification });
      setSuggestion(r.suggestion);
    } catch (e) { setErr(humanError(e, "AI assist is unavailable right now.")); }
    finally { setBusy(null); }
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">AI assist</span>
        {INTENTS.map(({ intent, label }) => (
          <button key={intent} type="button" onClick={() => run(intent)} disabled={!!busy}
            className="rounded border border-white/12 bg-white/[0.02] px-2 py-0.5 text-[11px] font-medium text-white/55 transition hover:border-seal-light/40 hover:text-white disabled:opacity-40">
            {busy === intent ? "…" : label}
          </button>
        ))}
      </div>
      {err && <p className="mt-1.5 text-[11px] text-amber-300/90">{err}</p>}
      {suggestion !== null && (
        <div className="mt-2 rounded-lg border border-seal-light/30 bg-seal/10 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-seal-light/80">Suggestion · you decide whether to use it</div>
          <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/85">{suggestion}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button type="button" onClick={() => { onApply(suggestion); setSuggestion(null); }} className="rounded bg-seal px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-seal-light">Replace</button>
            <button type="button" onClick={() => { onInsert(suggestion); setSuggestion(null); }} className="rounded border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/70 transition hover:text-white">Insert below</button>
            <button type="button" onClick={() => setSuggestion(null)} className="rounded px-2.5 py-1 text-[11px] text-white/40 transition hover:text-white/70">Discard</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Create;
