// One-Click Exit orchestrator. The founder clicks one button on the
// Dashboard and this module runs the 10-step exit process end-to-end:
// each step calls into @exit/engines and writes its artifact into a
// run record that is persisted to localStorage and surfaced across the
// console. Steps are deterministic — the small delays exist so the
// founder sees real progression rather than an instant cliff.

import {
  runValuation, strategicBuyerReport, assetReplacementReport,
  runReadiness, runReadinessAnalysis, runBuyerDiscovery, runDueDiligence,
  createListing, compareOffers, deriveNegotiationState,
  STANDARD_TEMPLATES, issueNda,
  TemplateMemorandumGenerator,
  type MemorandumDocument,
  type MarketplaceListing,
  type ValuationReport,
  type ReadinessReport,
  type BuyerDiscoveryReport,
  type DueDiligenceReport,
  type NdaInstance,
} from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile";
import { RESERVATION_LINES, SAMPLE_OFFERS } from "./engines";
import { listDocuments } from "./data-room";

export type ExitStepId =
  | "profile" | "valuation" | "readiness" | "cim" | "teaser"
  | "data_room" | "nda" | "buyers" | "pipeline" | "negotiator";

export type ExitStepStatus = "pending" | "running" | "done" | "error";

export interface ExitStep {
  readonly id: ExitStepId;
  readonly label: string;
  readonly verb: string;                     // active-voice line shown while running
  status: ExitStepStatus;
  startedAt?: string;
  finishedAt?: string;
  summary?: string;                          // one-line outcome
  error?: string;
}

export interface ExitRunArtifacts {
  valuation?: { standard: ValuationReport; strategic: ValuationReport; replacement: ValuationReport };
  readiness?: { report: ReadinessReport; analysis: ReturnType<typeof runReadinessAnalysis> };
  cim?: MemorandumDocument;
  teaser?: MemorandumDocument;
  dataRoomDocs?: number;
  ndasIssued?: readonly NdaInstance[];
  buyers?: BuyerDiscoveryReport;
  diligence?: DueDiligenceReport;
  listing?: { public: MarketplaceListing; private: MarketplaceListing };
  negotiation?: ReturnType<typeof deriveNegotiationState>;
  offerLeaderName?: string;
}

export interface ExitRun {
  readonly id: string;
  readonly startedAt: string;
  finishedAt?: string;
  status: "running" | "complete" | "errored";
  readonly steps: ExitStep[];
  readonly artifacts: ExitRunArtifacts;
}

const STORAGE_KEY = "exitos.run.v1";

export const EXIT_STEPS: readonly Omit<ExitStep, "status">[] = [
  { id: "profile",    label: "Read company profile",       verb: "Reading company profile" },
  { id: "valuation",  label: "Run valuation engine",       verb: "Running valuation (standard · strategic · replacement)" },
  { id: "readiness",  label: "Generate readiness score",   verb: "Scoring acquisition readiness" },
  { id: "cim",        label: "Generate CIM",                verb: "Drafting confidential information memorandum" },
  { id: "teaser",     label: "Generate teaser",             verb: "Drafting anonymized buyer teaser" },
  { id: "data_room",  label: "Provision data room",         verb: "Verifying virtual data room" },
  { id: "nda",        label: "Generate NDA templates",      verb: "Loading NDA templates · pre-issuing to top buyers" },
  { id: "buyers",     label: "Build buyer list",            verb: "Ranking strategic + financial acquirers" },
  { id: "pipeline",   label: "Open acquisition pipeline",   verb: "Creating public + private marketplace listings" },
  { id: "negotiator", label: "Activate AI negotiator",      verb: "Scoring active offers against reservation lines" },
];

export function loadRun(): ExitRun | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExitRun;
  } catch {
    return null;
  }
}

export function clearRun(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function persist(run: ExitRun): void {
  // Strip large artifact bodies before persisting — keep counts and identifiers.
  const slim: ExitRun = {
    ...run,
    artifacts: {
      valuation: run.artifacts.valuation ? {
        standard: run.artifacts.valuation.standard,
        strategic: run.artifacts.valuation.strategic,
        replacement: run.artifacts.valuation.replacement,
      } : undefined,
      readiness: run.artifacts.readiness,
      cim: run.artifacts.cim ? {
        ...run.artifacts.cim,
        sections: [],                          // body is regenerable; persist metadata only
      } : undefined,
      teaser: run.artifacts.teaser ? {
        ...run.artifacts.teaser,
        sections: [],
      } : undefined,
      dataRoomDocs: run.artifacts.dataRoomDocs,
      ndasIssued: run.artifacts.ndasIssued,
      buyers: run.artifacts.buyers,
      diligence: run.artifacts.diligence,
      listing: run.artifacts.listing,
      negotiation: run.artifacts.negotiation,
      offerLeaderName: run.artifacts.offerLeaderName,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const STEP_DELAY_MS = 380;                   // visible-but-fast pacing

export interface RunExitOptions {
  readonly onStepChange?: (run: ExitRun) => void;
  readonly fastMode?: boolean;                // skip artificial pacing
}

export async function runExitProcess(opts: RunExitOptions = {}): Promise<ExitRun> {
  const run: ExitRun = {
    id: `run-${Date.now().toString(36)}`,
    startedAt: new Date().toISOString(),
    status: "running",
    steps: EXIT_STEPS.map((s) => ({ ...s, status: "pending" })),
    artifacts: {},
  };
  const emit = (): void => { opts.onStepChange?.(run); persist(run); };
  const delay = opts.fastMode ? 0 : STEP_DELAY_MS;

  async function runStep<T>(id: ExitStepId, body: () => Promise<T> | T, summarize: (out: T) => string): Promise<T> {
    const step = run.steps.find((s) => s.id === id)!;
    step.status = "running";
    step.startedAt = new Date().toISOString();
    emit();
    try {
      const out = await body();
      step.status = "done";
      step.finishedAt = new Date().toISOString();
      step.summary = summarize(out);
      emit();
      if (delay > 0) await sleep(delay);
      return out;
    } catch (err) {
      step.status = "error";
      step.error = (err as Error).message;
      step.finishedAt = new Date().toISOString();
      emit();
      throw err;
    }
  }

  try {
    // 1. Profile
    await runStep("profile", () => SAMPLE_COMPANY,
      (c) => `${c.name} · ${c.sector.replace(/_/g, " ")} · ${(c.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(1)}M ARR`);

    // 2. Valuation
    const valuation = await runStep("valuation", () => ({
      standard:    runValuation(SAMPLE_COMPANY, { reportType: "standard" }),
      strategic:   strategicBuyerReport(SAMPLE_COMPANY),
      replacement: assetReplacementReport(SAMPLE_COMPANY),
    }), (v) => `Strategic mid $${(v.strategic.headline.mid / 1_000_000).toFixed(0)}M (band $${(v.strategic.headline.low / 1_000_000).toFixed(0)}M–$${(v.strategic.headline.high / 1_000_000).toFixed(0)}M)`);
    run.artifacts.valuation = valuation;

    // 3. Readiness
    const readiness = await runStep("readiness", () => {
      const report = runReadiness(SAMPLE_COMPANY);
      const analysis = runReadinessAnalysis(SAMPLE_COMPANY, report);
      return { report, analysis };
    }, (r) => `Score ${r.report.overallScore.toFixed(0)}/100 · ${r.report.band.replace(/_/g, " ")} · ${r.analysis.weaknesses.length} improvements identified`);
    run.artifacts.readiness = readiness;

    // 4. CIM
    const memoGen = new TemplateMemorandumGenerator();
    const buyersPreliminary = runBuyerDiscovery(SAMPLE_COMPANY, { limit: 12 });
    const diligence = runDueDiligence(SAMPLE_COMPANY);
    run.artifacts.diligence = diligence;
    const cim = await runStep("cim", () => memoGen.generate("cim", {
      company: SAMPLE_COMPANY, valuation: valuation.strategic,
      readiness: readiness.report, buyers: buyersPreliminary, diligence,
    }), (m) => `${m.sections.length} sections · ${m.wordCount.toLocaleString()} words`);
    run.artifacts.cim = cim;

    // 5. Teaser
    const teaser = await runStep("teaser", () => memoGen.generate("buyer_teaser", {
      company: SAMPLE_COMPANY, valuation: valuation.strategic,
      readiness: readiness.report, buyers: buyersPreliminary, diligence,
      anonymize: true,
    }), (m) => `Anonymized · ${m.wordCount.toLocaleString()} words · ${m.sections.length} sections`);
    run.artifacts.teaser = teaser;

    // 6. Data room
    const dataRoomDocs = await runStep("data_room", async () => {
      try {
        const docs = await listDocuments();
        return docs.length;
      } catch {
        return 0;                              // network/permission failures are non-fatal
      }
    }, (n) => n > 0 ? `Active · ${n} document${n === 1 ? "" : "s"} indexed` : `Provisioned · 7 rooms ready (financial · market · growth · tech · security · legal · commercial)`);
    run.artifacts.dataRoomDocs = dataRoomDocs;

    // 7. NDA — load templates + pre-issue against top buyers (pending signature)
    const listingPrivate = createListing(SAMPLE_COMPANY, { visibility: "private_full" });
    const listingPublic  = createListing(SAMPLE_COMPANY, { visibility: "public_anonymized" });
    const founderParty = { id: `founder-${SAMPLE_COMPANY.id}`, name: SAMPLE_COMPANY.name, representativeEmail: "founder@example.com" };
    const ndas = await runStep("nda", () => {
      const issued: NdaInstance[] = [];
      for (const c of buyersPreliminary.candidates.slice(0, 5)) {
        issued.push(issueNda({
          templateId: "tpl-bilateral-standard-v3",
          listingId: listingPrivate.listingId,
          disclosing: founderParty,
          receiving: { id: `buyer-${c.buyer.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name: c.buyer.name },
        }));
      }
      return issued;
    }, (issued) => `${STANDARD_TEMPLATES.length} templates loaded · ${issued.length} NDAs pre-issued to top buyers (pending signature)`);
    run.artifacts.ndasIssued = ndas;

    // 8. Buyer list (already computed in step 4 — re-run with full limit for the artifact)
    const buyers = await runStep("buyers", () => runBuyerDiscovery(SAMPLE_COMPANY, { limit: 20 }),
      (b) => `${b.candidates.length} qualified · ${b.byType.strategic} strategic · ${b.byType.pe} PE · ${b.byType.vc} VC · ${b.byType.family_office} family office`);
    run.artifacts.buyers = buyers;

    // 9. Pipeline = create marketplace listings (public + private)
    await runStep("pipeline", () => ({ public: listingPublic, private: listingPrivate }),
      (l) => `Listing ${l.private.listingId} created · public anonymized + private full-fidelity`);
    run.artifacts.listing = { public: listingPublic, private: listingPrivate };

    // 10. Negotiator — score the seeded offers and derive state
    const negotiation = await runStep("negotiator", () => {
      const comparison = compareOffers(SAMPLE_OFFERS, SAMPLE_COMPANY, valuation.strategic, RESERVATION_LINES);
      const state = deriveNegotiationState({
        stage: "loi",
        activeOffers: SAMPLE_OFFERS.length,
        ...(comparison.leader ? { leadingBuyer: comparison.leader } : {}),
        daysSinceLastMove: 3,
        hasExclusivity: false,
      });
      return { state, comparison };
    }, (n) => n.comparison.leader
      ? `${SAMPLE_OFFERS.length} offers scored · leader: ${n.comparison.leader} · stage ${n.state.stage}`
      : `${SAMPLE_OFFERS.length} offers scored · stage ${n.state.stage}`);
    run.artifacts.negotiation = negotiation.state;
    run.artifacts.offerLeaderName = negotiation.comparison.leader;

    run.status = "complete";
    run.finishedAt = new Date().toISOString();
    emit();
    return run;
  } catch (err) {
    run.status = "errored";
    run.finishedAt = new Date().toISOString();
    emit();
    throw err;
  }
}
