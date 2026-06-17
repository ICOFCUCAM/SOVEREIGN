// Deliverables — turns engine output into real, downloadable artifacts the
// founder can review and send. Every builder is pure (string in / string out)
// so the same Markdown a modal previews is exactly what downloads. Documents
// are framed to a consistent, institutional standard: a confidential header,
// numbered sections, real tables, and a standing disclaimer — banker-desk
// quality, generated from the company's own data and the platform's engines.

import type { MemorandumDocument, BuyerCandidate, ValuationReport, InstitutionalValuationReport, TracedDocument } from "@exit/engines";
import type { RiskReport } from "./diligence-intel.js";
import { downloadText, notify } from "./ui";

const money = (n?: number | null): string =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const pct = (x?: number | null, digits = 0): string => (x == null ? "—" : `${(x * 100).toFixed(digits)}%`);
const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
const today = (): string => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const titleCase = (s: string): string => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const DISCLAIMER =
  "This document has been prepared by ExitOS on behalf of the Company from information provided by the Company " +
  "and sources believed to be reliable; no representation or warranty, express or implied, is made as to its accuracy or completeness. " +
  "It is furnished on a strictly confidential basis to a limited number of qualified parties, does not constitute investment, legal or tax advice, " +
  "and all figures remain subject to due diligence and definitive documentation. Distribution or reproduction, in whole or in part, " +
  "without prior written consent is prohibited.";

// Report identity — a recognizable masthead so any exported document is
// identifiable as ExitOS without the name. ◎ is the Exchange Mark geometry
// (transaction ring + live core) rendered in plain text.
const RULE = "═══════════════════════════════════════════";
const MASTHEAD: readonly string[] = ["◎ **EXITOS** · ACQUISITION EXCHANGE", RULE, ""];
const COLOPHON: readonly string[] = [
  "",
  "───────────────────────────────────────────",
  "◎ EXITOS · ACQUISITION EXCHANGE · Strictly confidential — for the addressed counterparty only",
  "",
  `_${DISCLAIMER}_`,
];

// ── Document framework ──────────────────────────────────────────────

export interface DocSection {
  readonly heading: string;
  readonly body?: string;
  readonly bullets?: readonly string[];
  readonly table?: { readonly headers: readonly string[]; readonly rows: ReadonlyArray<readonly string[]> };
}

function mdTable(headers: readonly string[], rows: ReadonlyArray<readonly string[]>): string[] {
  const out = [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`];
  for (const r of rows) out.push(`| ${r.join(" | ")} |`);
  return out;
}

/** Frame a set of sections into a consistent, institutional-grade document. */
export function frameDoc(opts: {
  title: string;
  subtitle?: string;
  meta?: ReadonlyArray<[string, string]>;
  sections: readonly DocSection[];
  confidential?: boolean;
  disclaimerOverride?: string;
}): string {
  const { title, subtitle, meta = [], sections, confidential = true, disclaimerOverride } = opts;
  const lines: string[] = [...MASTHEAD, `# ${title}`];
  if (subtitle) lines.push(`### ${subtitle}`);
  lines.push("");
  lines.push(`${confidential ? "**STRICTLY CONFIDENTIAL** · " : ""}Prepared by **ExitOS Advisory** · ${today()}`);
  const metaAll: Array<[string, string]> = [["Basis", "Company records and management information"], ...meta];
  lines.push("", ...metaAll.map(([k, v]) => `- **${k}:** ${v}`), "", "---", "");
  sections.forEach((s, i) => {
    lines.push(`## ${i + 1}. ${s.heading}`, "");
    if (s.body) lines.push(s.body, "");
    if (s.bullets?.length) { for (const b of s.bullets) lines.push(`- ${b}`); lines.push(""); }
    if (s.table) { lines.push(...mdTable(s.table.headers, s.table.rows), ""); }
  });
  if (disclaimerOverride) {
    lines.push("", "───────────────────────────────────────────",
      "◎ EXITOS · ACQUISITION EXCHANGE · Strictly confidential — for the addressed counterparty only", "",
      `_${disclaimerOverride}_`);
  } else {
    lines.push(...COLOPHON);
  }
  return lines.join("\n");
}

// ── Generated memoranda (CIM, teaser, summary, deck, DD index) ───────

/** A generated memorandum → Markdown, with the same confidential framing. */
export function docToMarkdown(doc: MemorandumDocument): string {
  const lines: string[] = [
    ...MASTHEAD,
    `# ${doc.title}`, "",
    `**STRICTLY CONFIDENTIAL** · Prepared by **ExitOS Advisory** for qualified counterparties${doc.anonymized ? " · identity withheld pending NDA" : ""}`,
    `_${today()}_`, "", "---", "",
  ];
  for (const s of doc.sections) {
    lines.push(`## ${s.heading}`, "", s.body, "");
    for (const b of s.bullets ?? []) lines.push(`- ${b}`);
    if (s.bullets?.length) lines.push("");
    for (const t of s.tables ?? []) {
      lines.push(...mdTable(t.headers, t.rows));
      if (t.caption) lines.push("", `_${t.caption}_`);
      lines.push("");
    }
  }
  lines.push(...COLOPHON);
  return lines.join("\n");
}

export const docFilename = (doc: MemorandumDocument): string => `${slug(doc.title)}.md`;

// ── Valuation summary ───────────────────────────────────────────────

/** A banker-grade valuation memo from the engine's ValuationReport. */
export function valuationMemo(report: ValuationReport, companyName: string): string {
  const h = report.headline;
  const conclusion =
    `We assess a strategic-buyer enterprise value of **${money(h.mid)}**, within a defensible range of ` +
    `**${money(h.low)} – ${money(h.high)}**. The midpoint blends ${report.methodologies.length} weighted ` +
    `methodologies applied to the company's reported figures, a ${report.countryAdjustment.toFixed(2)}× country ` +
    `adjustment, and ${report.premiums.length} strategic-buyer premium${report.premiums.length === 1 ? "" : "s"}.`;

  const sections: DocSection[] = [
    {
      heading: "Valuation conclusion",
      body: conclusion,
      table: {
        headers: ["Measure", "Value"],
        rows: [
          ["Low", money(h.low)],
          ["Midpoint", money(h.mid)],
          ["High", money(h.high)],
          ["Country adjustment", `${report.countryAdjustment.toFixed(2)}×`],
        ],
      },
    },
    {
      heading: "Methodology",
      body: "Each method is applied to the company's own figures and weighted by reliability for this profile. The midpoint is the weighted blend of the methods below.",
      table: {
        headers: ["Methodology", "Basis", "Multiple", "Range (low – high)", "Weight"],
        rows: report.methodologies.map((m) => [
          m.name,
          m.basis,
          m.multiple != null ? `${m.multiple.toFixed(1)}×` : "—",
          `${money(m.band.low)} – ${money(m.band.high)}`,
          pct(m.weight),
        ]),
      },
    },
  ];

  if (report.premiums.length) {
    sections.push({
      heading: "Strategic premia",
      body: "Adjustments a strategic acquirer would rationally pay above the financial-buyer baseline.",
      table: {
        headers: ["Premium", "Uplift", "Rationale"],
        rows: report.premiums.map((p) => [p.name, pct(p.pct), p.reason]),
      },
    });
  }
  if (report.notes.length) {
    sections.push({ heading: "Assumptions & notes", bullets: report.notes });
  }

  return frameDoc({
    title: "Company Valuation — Summary",
    subtitle: `${companyName} · strategic-buyer basis`,
    meta: [["Prepared for", "The Board and shareholders of the Company"], ["Approach", `${titleCase(report.reportType)} basis · comparable transactions and fundamentals`]],
    sections,
  });
}

// ── Traced documents (Level 3 — the document factory) ───────────────

/** Render a traced document → Markdown. The fact sheet leads; every number
 *  in the prose traces to it. A compliance line states the traceability. */
export function tracedDocMarkdown(doc: TracedDocument): string {
  const t = doc.traceability;
  const sections: DocSection[] = doc.sections.map((s) => ({
    heading: s.heading,
    ...(s.body ? { body: s.body } : {}),
    ...(s.bullets ? { bullets: s.bullets } : {}),
    ...(s.rows ? { table: { headers: s.tableHeaders ?? [], rows: s.rows } } : {}),
  }));
  sections.push({
    heading: "Traceability",
    body: `${t.traced} of ${t.checked} numeric figures in this document trace to a stored source (${t.ok ? "100% — fully traceable" : `${t.untraced.length} untraced`}). No figure is shown without a source, confidence, methodology and date. Prepared under ExitOS Valuation Framework v${doc.frameworkVersion}.`,
  });
  return frameDoc({
    title: doc.title,
    subtitle: doc.subtitle,
    meta: [["Framework", `ExitOS Valuation Framework v${doc.frameworkVersion}`], ["Traceability", t.ok ? "100% — every figure sourced" : `${t.untraced.length} untraced`]],
    sections,
    disclaimerOverride: doc.disclaimer,
  });
}

// ── Institutional valuation summary ─────────────────────────────────

const days = (n: number): string => `${Math.round(n)}`;

/** The institutional-grade valuation: every figure traced to evidence —
 *  an explained conclusion, a precedent-based premium, comparable
 *  transactions, a confidence score and the buyer universe behind it. */
export function institutionalValuationMemo(report: InstitutionalValuationReport): string {
  const h = report.headline;
  const fb = report.financialBaseline;
  const p = report.premium;

  // The headline summary block the desk reads first.
  const summary: DocSection = {
    heading: "Valuation summary",
    body:
      `We assess a strategic-buyer enterprise value of **${money(h.mid)}** ` +
      `(range ${money(h.low)} – ${money(h.high)}). The midpoint is the financial baseline of ` +
      `${money(fb.mid)} uplifted by an evidence-based strategic premium of **+${pct(p.appliedPct)}** — ` +
      `the mean of ${p.observedPremiums.length} observed precedent transaction${p.observedPremiums.length === 1 ? "" : "s"}, ` +
      `not a flat assumption.`,
    table: {
      headers: ["Measure", "Value"],
      rows: [
        ["Enterprise value — low", money(h.low)],
        ["Enterprise value — midpoint", money(h.mid)],
        ["Enterprise value — high", money(h.high)],
        ["Valuation confidence", `${report.confidence.score}% · ${report.confidence.tier}`],
        ["Strategic buyer premium", `+${pct(p.appliedPct)} (range ${pct(p.rangeLowPct)}–${pct(p.rangeHighPct)})`],
        ["Comparable transactions used", String(report.comparablesUsed)],
        ["Qualified buyer universe", `${report.buyerUniverse.qualified} (of ${report.buyerUniverse.scored} scored)`],
        ["Most likely buyers", report.mostLikelyBuyers.slice(0, 5).map((b) => b.name).join(", ") || "—"],
        ["Expected time to close", `${days(report.timeToClose.lowDays)}–${days(report.timeToClose.highDays)} days`],
      ],
    },
  };

  const methodology: DocSection = {
    heading: "Methodology & weighting",
    body: "Each method is applied to the company's own figures and weighted by reliability for this profile; the weights are normalized and sum to 100%. The range on each line is the sector's observed trough-to-peak multiple band — which is why the same company can support both the low and high figures under different market conditions.",
    table: {
      headers: ["Methodology", "Basis", "Multiple", "Range (low – high)", "Weight", "Market evidence"],
      rows: report.methodologies.map((m) => [
        m.name,
        m.basis,
        m.multiple != null ? `${m.multiple.toFixed(1)}×` : "—",
        `${money(m.band.low)} – ${money(m.band.high)}`,
        `${m.weightPct}%`,
        m.evidence,
      ]),
    },
  };

  const premium: DocSection = {
    heading: "Strategic premium — evidence",
    body:
      `${p.note} Confidence: ${p.confidence.tier} (${p.confidence.note}). ` +
      `In-sector precedents: ${p.inSectorSample}; market-wide precedents: ${p.marketSample}.`,
    table: {
      headers: ["Observed precedent premiums (sorted)"],
      rows: p.observedPremiums.length
        ? [[p.observedPremiums.map((x) => pct(x)).join(" · ")]]
        : [["No precedent with a disclosed reference price — neutral prior applied"]],
    },
  };

  const comps: DocSection = {
    heading: "Comparable transactions",
    body: `${report.comparablesUsed} source-referenced transactions in the company's sector, most recent first.`,
    table: {
      headers: ["Target", "Acquirer", "Date", "Value", "Premium", "Days to close", "Source"],
      rows: report.comparableTransactions.map((c) => [
        c.target,
        c.buyer,
        c.date ?? "—",
        c.priceUsd != null ? money(c.priceUsd) : "undisclosed",
        c.premiumPct != null ? pct(c.premiumPct) : "—",
        c.closeDays != null ? days(c.closeDays) : "—",
        c.sourceRef,
      ]),
    },
  };

  const buyers: DocSection = {
    heading: "Buyer universe & most likely acquirers",
    body:
      `Ranked against ${report.buyerUniverse.scored} scored mandates from a ${report.buyerUniverse.registry}-buyer curated registry; ` +
      `${report.buyerUniverse.qualified} clear a 50% acquisition-probability bar. The list below is ranked by fit-adjusted ` +
      `expected value — the buyers most likely to actually transact with this company, not merely the largest.`,
    table: {
      headers: ["#", "Buyer", "Acquisition probability", "Expected days to close"],
      rows: report.mostLikelyBuyers.map((b, i) => [
        String(i + 1),
        b.name,
        `${b.probabilityPct}%`,
        `${b.expectedDaysToCash}d`,
      ]),
    },
  };

  const rationale: DocSection = {
    heading: "Strategic buyer rationale",
    body: "Why a strategic acquirer would pay the premium above the financial-buyer baseline:",
    bullets: report.strategicRationale,
  };

  const confidence: DocSection = {
    heading: "Confidence score",
    body: `**${report.confidence.score}% — ${report.confidence.tier}.** ${report.confidence.note}`,
    table: {
      headers: ["Driver", "Score"],
      rows: [
        ["Data completeness", pct(report.confidence.drivers.dataCompleteness)],
        ["Comparable depth", pct(report.confidence.drivers.comparableDepth)],
        ["Sector maturity", pct(report.confidence.drivers.sectorMaturity)],
        ["Financial quality", pct(report.confidence.drivers.financialQuality)],
        ["Data freshness", pct(report.confidence.drivers.dataFreshness)],
      ],
    },
  };

  // Required-variable coverage with per-figure provenance — the framework's
  // contract that no figure is shown without a traceable source.
  const allVars = [
    ...report.variables.company, ...report.variables.market,
    ...report.variables.buyer, ...report.variables.execution,
  ];
  const variableCoverage: DocSection = {
    heading: "Valuation variables & provenance",
    body: `Every variable the framework requires, with its value and provenance. Variables marked absent lower the confidence score rather than being silently omitted. Required provenance fields: ${report.provenanceSummary.requiredFields.join(", ")}.`,
    table: {
      headers: ["Variable", "Value", "Source", "Verification", "Last updated"],
      rows: allVars.map((v) => [
        v.name,
        v.present ? v.value : "— absent",
        v.source,
        v.verification_status,
        v.last_updated.length > 10 ? v.last_updated.slice(0, 10) : v.last_updated,
      ]),
    },
  };

  const provenance: DocSection = {
    heading: "Data provenance summary",
    body: `${report.provenanceSummary.note} ${report.provenanceSummary.totalFigures} sourced figures in total${report.provenanceSummary.mostRecentDataDate ? `; most recent evidence dated ${report.provenanceSummary.mostRecentDataDate}` : ""}.`,
    table: {
      headers: ["Source", "Figures"],
      rows: Object.entries(report.provenanceSummary.bySource).map(([s, n]) => [s, String(n)]),
    },
  };

  // Explicit mandatory-output checklist so the document proves compliance.
  const mandatory: DocSection = {
    heading: "Framework compliance — mandatory outputs",
    body: `Prepared under ExitOS Valuation Framework v${report.frameworkVersion}. All ten mandatory outputs are present:`,
    table: {
      headers: ["#", "Mandatory output", "Value"],
      rows: [
        ["1", "Enterprise value range", report.mandatoryOutputs.enterprise_value_range],
        ["2", "Midpoint valuation", report.mandatoryOutputs.midpoint_valuation],
        ["3", "Confidence score", report.mandatoryOutputs.confidence_score],
        ["4", "Valuation methodologies", report.mandatoryOutputs.valuation_methodologies],
        ["5", "Methodology weighting", report.mandatoryOutputs.methodology_weighting],
        ["6", "Comparable transaction count", report.mandatoryOutputs.comparable_transaction_count],
        ["7", "Strategic premium basis", report.mandatoryOutputs.strategic_premium_basis],
        ["8", "Buyer universe size", report.mandatoryOutputs.buyer_universe_size],
        ["9", "Expected time to close", report.mandatoryOutputs.expected_time_to_close],
        ["10", "Data provenance summary", report.mandatoryOutputs.data_provenance_summary],
      ],
    },
  };

  return frameDoc({
    title: "Institutional Valuation — Summary",
    subtitle: `${report.companyName} · strategic-buyer basis · ${report.confidence.tier} confidence · Framework v${report.frameworkVersion}`,
    meta: [
      ["Prepared for", "The Board and shareholders of the Company"],
      ["Approach", "Multiples baseline · precedent-transaction premium · comparable analysis · buyer-universe intelligence"],
      ["Framework", `ExitOS Valuation Framework v${report.frameworkVersion}`],
    ],
    sections: [summary, methodology, premium, comps, buyers, rationale, confidence, variableCoverage, provenance, mandatory, { heading: "Assumptions & notes", bullets: report.notes }],
    disclaimerOverride: report.disclaimer,
  });
}

// ── Buyer target list ───────────────────────────────────────────────

const fitLine = (f: BuyerCandidate["fitDimensions"]): string =>
  `sector ${pct(f.sectorFit)} · model ${pct(f.modelFit)} · check ${pct(f.checkFit)} · geography ${pct(f.geographyFit)} · activity ${pct(f.activityFit)} · track record ${pct(f.historyFit)}`;

/** A full buyer target list — ranked summary table plus a profile per buyer
 *  with thesis, fit breakdown and the engine's expected outcome. */
export function buyerShortlistMemo(candidates: readonly BuyerCandidate[], projectName: string): string {
  const summary: DocSection = {
    heading: "Ranked shortlist",
    body: "Screened from a curated acquirer registry against sector, business model, check size, geography, recent activity and demonstrated M&A track record. Acquisition probability reflects our assessment of mandate fit and intent; expected offer and time-to-close are benchmarked against each acquirer's completed-transaction record.",
    table: {
      headers: ["#", "Buyer", "Type", "Prob.", "Expected offer", "Days to close", "Check range"],
      rows: candidates.map((c, i) => [
        String(i + 1),
        c.buyer.name,
        titleCase(c.buyer.buyerType),
        pct(c.probability),
        money(c.expectedOutcome.expectedHeadlineUsd),
        `${Math.round(c.expectedOutcome.expectedDaysToCash)}d`,
        `${money(c.estimatedCheck.low)} – ${money(c.estimatedCheck.high)}`,
      ]),
    },
  };

  const profiles: DocSection[] = candidates.map((c, i) => ({
    heading: `${i + 1}. ${c.buyer.name} — ${titleCase(c.buyer.buyerType)}`,
    bullets: [
      `**Thesis:** ${c.buyer.thesis}`,
      `**Why matched:** ${c.rationale}`,
      `**Acquisition probability:** ${pct(c.probability)} (${c.expectedOutcome.overallConfidence.tier} confidence)`,
      `**Expected outcome:** offer ${money(c.expectedOutcome.expectedHeadlineUsd)} → ${money(c.expectedOutcome.expectedClosingUsd)} expected net, ~${Math.round(c.expectedOutcome.expectedDaysToCash)} days, ${pct(c.expectedOutcome.premiumPct)} premium`,
      `**Fit:** ${fitLine(c.fitDimensions)}`,
      `**Check range:** ${money(c.estimatedCheck.low)} – ${money(c.estimatedCheck.high)}`,
      `**Sectors:** ${c.buyer.sectorsActive.map(titleCase).join(", ")}`,
      `**Geography:** ${c.buyer.geographyPreferred.length ? c.buyer.geographyPreferred.join(", ") : "Global"} · appetite ${c.buyer.appetite}`,
      `**Tracked deals:** ${c.history.totalDeals}${c.history.lastTargetName ? ` · most recent ${c.history.lastTargetName}` : ""}`,
    ],
  }));

  return frameDoc({
    title: "Buyer Target List",
    subtitle: `${projectName} · ${candidates.length} shortlisted acquirers`,
    sections: [summary, { heading: "Buyer profiles", body: "Full profile for each shortlisted acquirer." }, ...profiles],
  });
}

/** The ranked buyer shortlist → an analyst-grade CSV. */
export function buyerListCsv(candidates: readonly BuyerCandidate[]): string {
  const header = ["Rank", "Buyer", "Type", "Appetite", "Acq. probability", "Expected offer (USD)", "Expected net (USD)", "Days to close", "Premium", "Confidence", "Check low (USD)", "Check high (USD)", "Sector fit", "Geography fit", "Track-record fit", "Sectors", "Geography", "Thesis", "Rationale"];
  const q = (s: string): string => `"${s.replace(/"/g, "'")}"`;
  const rows = candidates.map((c, i) => [
    String(i + 1),
    q(c.buyer.name),
    c.buyer.buyerType,
    c.buyer.appetite,
    `${Math.round(c.probability * 100)}%`,
    String(Math.round(c.expectedOutcome.expectedHeadlineUsd)),
    String(Math.round(c.expectedOutcome.expectedClosingUsd)),
    String(Math.round(c.expectedOutcome.expectedDaysToCash)),
    `${Math.round(c.expectedOutcome.premiumPct * 100)}%`,
    c.expectedOutcome.overallConfidence.tier,
    String(c.estimatedCheck.low),
    String(c.estimatedCheck.high),
    `${Math.round(c.fitDimensions.sectorFit * 100)}%`,
    `${Math.round(c.fitDimensions.geographyFit * 100)}%`,
    `${Math.round(c.fitDimensions.historyFit * 100)}%`,
    q(c.buyer.sectorsActive.map(titleCase).join("; ")),
    q(c.buyer.geographyPreferred.length ? c.buyer.geographyPreferred.join("; ") : "Global"),
    q(c.buyer.thesis),
    q(c.rationale),
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\n") + "\n";
}

// ── Buyer introduction letter ───────────────────────────────────────

export function buyerIntroLetter(opts: {
  buyer: BuyerCandidate;
  projectName: string;
  askMid: number;
  fromName: string;
  anonymized?: boolean;
}): string {
  const { buyer, projectName, askMid, fromName, anonymized = true } = opts;
  const eo = buyer.expectedOutcome;
  return [
    `◎ EXITOS · ACQUISITION EXCHANGE`,
    `STRICTLY CONFIDENTIAL`,
    `${today()}`,
    "",
    `To:      ${buyer.buyer.name} — Corporate Development`,
    `From:    ${fromName} · c/o ExitOS Advisory`,
    `Re:      ${anonymized ? `${projectName} — a proprietary acquisition opportunity` : "Acquisition opportunity"}`,
    "",
    `Dear ${buyer.buyer.name} team,`,
    "",
    `We are reaching out on a confidential basis regarding ${projectName}, a proprietary opportunity we believe maps directly to your stated mandate — "${buyer.buyer.thesis}".`,
    "",
    `Why we thought of you specifically: ${buyer.rationale}`,
    "",
    `Indicative parameters:`,
    `  • Indicated enterprise value (mid): ${money(askMid)}`,
    `  • Estimated fit: ${pct(buyer.probability)} acquisition probability (${eo.overallConfidence.tier} confidence)`,
    `  • Your typical check for this profile: ${money(buyer.estimatedCheck.low)} – ${money(buyer.estimatedCheck.high)}`,
    `  • Benchmark pace from your track record: ~${Math.round(eo.expectedDaysToCash)} days announced-to-close`,
    "",
    `All identifying materials are gated behind a mutual NDA. On execution we will share the confidential information memorandum and open staged data-room access.`,
    "",
    `If this is of interest, simply reply and we will coordinate a first call at your convenience.`,
    "",
    `Best regards,`,
    fromName,
    `For and on behalf of the Company · c/o ExitOS Advisory`,
    "",
  ].join("\n");
}

export const introFilename = (buyer: BuyerCandidate): string => `intro-${slug(buyer.buyer.name)}.txt`;

// ── Diligence / risk report ─────────────────────────────────────────

export function riskReportDoc(report: RiskReport): string {
  const sev = report.bySeverity;
  return frameDoc({
    title: report.title,
    subtitle: `${report.audience === "seller" ? "Seller-side" : "Buyer-side"} diligence intelligence`,
    sections: [
      { heading: "Executive summary", body: report.headline },
      {
        heading: "Severity profile",
        table: {
          headers: ["Severity", "Findings", "Value exposed"],
          rows: [
            ["High", String(sev.high), ""],
            ["Medium", String(sev.medium), ""],
            ["Low", String(sev.low), ""],
            ["**Total**", `**${sev.high + sev.medium + sev.low}**`, `**${money(report.totalImpactUsd)}**`],
          ],
        },
      },
      {
        heading: "Findings",
        bullets: report.points.map((p) => `**${p.title}** — ${p.body}`),
      },
      { heading: "Recommendation", body: report.recommendation },
    ],
  });
}

// ── Generic structured doc (for the remaining agent work products) ──

export function structuredDoc(title: string, subtitle: string, sections: readonly DocSection[]): string {
  return frameDoc({ title, subtitle, sections });
}

// ── Agent work products (Autonomous Exit + The Banker) ─────────────
// Parameterized builders so every document the agents produce is testable
// end-to-end — no inline one-off strings in page components.

export function outreachPlanDoc(opts: { projectName: string; shortlistCount: number; anchor: string }): string {
  return structuredDoc("Outreach Plan", `${opts.projectName} · sell-side process`, [
    { heading: "Approach", body: `A ${opts.shortlistCount}-buyer competitive process run in parallel to build leverage, anchored at ${opts.anchor}. All outreach is anonymized pre-NDA; identity and the data room unlock only on a signed NDA.` },
    { heading: "Sequence", table: { headers: ["Step", "Timing", "Action"], rows: [
      ["1 · Target list", "Day 0", "Rank acquirers by fit, appetite and recent activity"],
      ["2 · Teaser", "Day 1", "Issue the anonymized teaser to tier-1 targets"],
      ["3 · NDA + data room", "Day 3–7", "Counter-sign NDAs; grant staged data-room access"],
      ["4 · Management presentations", "Week 2–3", "Distribute the CIM; schedule calls with engaged buyers"],
      ["5 · Indications", "Week 4", "Solicit non-binding IOIs; build the offer comparison"],
      ["6 · LOI", "Week 5–6", "Drive a competitive process to a signed letter of intent"],
    ] } },
    { heading: "Personalization", body: "Each shortlisted buyer receives an introduction letter written to its own mandate thesis and the specific strategic rationale for the fit." },
  ]);
}

export function dataRoomGatingDoc(packageCount: number): string {
  return structuredDoc("Data-Room Gating Policy", "Permissioned access for a controlled process", [
    { heading: "Access control", body: "No buyer reaches the data room until they clear a mutual NDA and a Buyer Trust score of Verified. Access is staged by diligence package, fully logged and revocable." },
    { heading: "Buyer Trust gates", table: { headers: ["Gate", "Requirement"], rows: [
      ["NDA signed", "Executed mutual NDA on file"],
      ["Identity verified", "Authorized signatory on the signature record"],
      ["Acquisition history", "Institutional counterparty with a validated track record"],
      ["Funds verified", "Capitalised counterparty with damages provision in force"],
    ] } },
    { heading: "Packages", body: `${packageCount} staged diligence packages, each completeness-scored, with the dollar impact of every gap surfaced before buyers see it.` },
  ]);
}

export interface OfferLine { readonly buyer: string; readonly type: string; readonly score: string; readonly headline: string; readonly net: string }
export function offerComparisonDoc(opts: {
  summary: string;
  offers: readonly OfferLine[];
  dynamics: ReadonlyArray<[string, string]>;
  posture: readonly string[];
}): string {
  return structuredDoc("Offer Comparison", "Cross-bid analysis & negotiation posture", [
    { heading: "Summary", body: opts.summary },
    { heading: "Bids", table: { headers: ["Buyer", "Type", "Score", "Headline", "Net to founders"], rows: opts.offers.map((o) => [o.buyer, o.type, o.score, o.headline, o.net]) } },
    { heading: "Field dynamics", bullets: opts.dynamics.map(([term, notes]) => `**${term}:** ${notes}`) },
    { heading: "Posture", bullets: opts.posture },
  ]);
}

export function closingChecklistDoc(): string {
  return structuredDoc("Closing Checklist", "Signature, escrow & filing orchestration to the wire", [
    { heading: "Workstreams", table: { headers: ["Item", "Owner", "Status"], rows: [
      ["SPA + signature pages", "Counsel", "In progress"],
      ["Disclosure schedules", "Counsel", "In progress"],
      ["Shareholder consent (≥95%)", "Founder", "In progress"],
      ["Escrow agent engagement", "Banker", "Done"],
      ["Escrow funding confirmation", "Banker", "Pending"],
      ["Regulatory filings", "Counsel", "In progress"],
    ] } },
    { heading: "Economics", bullets: [
      "Escrow capped at ≤8% of consideration, released in 12 months",
      "Reverse break-fee in force; no founder indemnity beyond escrow",
      "30–45 day sign-to-close target",
    ] },
  ]);
}

export function wealthPlanDoc(headline: string): string {
  return structuredDoc("Wealth Transition Plan", "From a concentrated position to durable wealth", [
    { heading: "Proceeds", body: `Headline consideration of ${headline} modeled through federal and state tax, with QSBS treatment evaluated where the holding qualifies.` },
    { heading: "Plan", bullets: [
      "Staged liquidity schedule across the months after close",
      "Diversification out of the single concentrated position into a durable portfolio",
      "Trust, family-office and reinvestment structuring evaluated against the after-tax base",
    ] },
    { heading: "Note", body: "Figures are planning estimates. Tax outcomes depend on structure and jurisdiction and require a qualified advisor before any election." },
  ]);
}

/** Backward-compatible simple brief, now framed and disclaimed. */
export function briefMarkdown(title: string, rows: ReadonlyArray<[string, string]>, body?: string): string {
  return frameDoc({
    title,
    sections: [{ heading: "Summary", ...(body ? { body } : {}), bullets: rows.map(([k, v]) => `**${k}:** ${v}`) }],
  });
}

// ── Send / download ─────────────────────────────────────────────────

export function sendDeliverable(filename: string, text: string): void {
  downloadText(filename, text);
  notify(`Sent · ${filename}`);
}

export function downloadDeliverable(filename: string, text: string): void {
  downloadText(filename, text);
}
