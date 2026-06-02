import type { CompanyProfile, EngineMeta } from '../types.js';

export type DiligenceDocumentKind =
  | 'financial'
  | 'market'
  | 'user_growth'
  | 'technical_architecture'
  | 'security'
  | 'legal'
  | 'commercial';

export interface DiligenceDocumentSpec {
  readonly kind: DiligenceDocumentKind;
  readonly title: string;
  readonly sections: readonly DiligenceSection[];
  readonly artifacts: readonly DiligenceArtifact[];
  readonly classification: 'unclassified' | 'sensitive' | 'confidential';
}

export interface DiligenceSection {
  readonly heading: string;
  readonly questions: readonly string[];
  readonly evidence: readonly string[];
}

export interface DiligenceArtifact {
  readonly filename: string;
  readonly description: string;
  readonly required: boolean;
}

export interface DueDiligenceReport {
  readonly meta: EngineMeta;
  readonly company: string;
  readonly documents: readonly DiligenceDocumentSpec[];
  readonly criticalQuestions: readonly string[];
  readonly redFlags: readonly string[];
}

const ENGINE = 'diligence';
const VERSION = '0.1.0';

function financialDD(c: CompanyProfile): DiligenceDocumentSpec {
  return {
    kind: 'financial',
    title: 'Financial diligence package',
    classification: 'confidential',
    sections: [
      {
        heading: 'Revenue quality',
        questions: [
          'Audited financials for the last three fiscal years',
          'Monthly P&L for the trailing 24 months',
          'Revenue by customer cohort and product line',
          'Recurring vs non-recurring revenue split',
          `Top-10 customer concentration${(c.revenue.customerConcentrationTop10Pct ?? 0) > 0.4 ? ' (note: company carries elevated concentration)' : ''}`,
        ],
        evidence: ['Audited statements', 'GL extracts', 'Customer revenue waterfall'],
      },
      {
        heading: 'Unit economics',
        questions: [
          'CAC, LTV, payback period by acquisition channel',
          'Gross margin trend over last 8 quarters',
          'Contribution margin by product line',
          c.revenue.netRetentionPct != null ? `Net retention reconciliation (reported ${(c.revenue.netRetentionPct * 100).toFixed(0)}%)` : 'Net retention reconciliation',
        ],
        evidence: ['Cohort analysis', 'Margin bridge', 'Channel attribution'],
      },
      {
        heading: 'Cap table & liquidity',
        questions: [
          'Fully-diluted cap table with vesting schedules',
          'Preference stack and waterfall analysis',
          'Prior round documents and rights of first refusal',
          c.cap.preferenceStackUsd ? `Preference stack $${(c.cap.preferenceStackUsd / 1_000_000).toFixed(1)}M — buyer waterfall sensitivity` : 'Preference stack analysis',
        ],
        evidence: ['Cap table CSV', 'Stock purchase agreements', 'Side letters'],
      },
    ],
    artifacts: [
      { filename: 'financials/audited_FY{n-2}_FY{n}.pdf', description: 'Audited annual financials', required: true },
      { filename: 'financials/management_pack_Q{n}.xlsx', description: 'Latest management accounts', required: true },
      { filename: 'financials/cap_table_v{n}.xlsx',       description: 'Cap table with waterfall',   required: true },
      { filename: 'financials/cohort_analysis.xlsx',      description: 'Customer cohort waterfall',   required: true },
    ],
  };
}

function marketDD(c: CompanyProfile): DiligenceDocumentSpec {
  return {
    kind: 'market',
    title: 'Market diligence package',
    classification: 'sensitive',
    sections: [
      {
        heading: 'Market sizing',
        questions: [
          `Bottom-up TAM build for ${c.sector}`,
          'Geographic breakdown of serviceable market',
          'Customer-acquirable population and market depth',
          c.market.serviceableMarketUsd != null ? `SAM reconciliation ($${(c.market.serviceableMarketUsd / 1_000_000_000).toFixed(2)}B)` : 'SAM build',
        ],
        evidence: ['Analyst market reports', 'Internal TAM model', 'Customer count by segment'],
      },
      {
        heading: 'Competitive landscape',
        questions: [
          'Comparable companies by feature/price/positioning',
          'Win/loss analysis (last 24 months)',
          'Competitive density and pricing power',
          c.market.competitiveDensity === 'high' ? 'Differentiation thesis vs. dense field' : 'Differentiation thesis',
        ],
        evidence: ['Competitor teardowns', 'Win/loss CRM extract', 'Pricing benchmark'],
      },
      {
        heading: 'Regulatory & macro',
        questions: [
          `Regulatory regime in ${c.jurisdiction}`,
          'Pending legislation that materially affects the business',
          c.market.regulatoryRisk === 'high' ? 'Elevated regulatory risk — counsel memo required' : 'Regulatory memo',
        ],
        evidence: ['Counsel memo', 'Compliance program', 'Lobbying / advocacy posture'],
      },
    ],
    artifacts: [
      { filename: 'market/tam_sam_som_v{n}.pdf',       description: 'TAM/SAM/SOM model deck',      required: true },
      { filename: 'market/competitor_matrix.xlsx',     description: 'Competitive feature matrix',  required: true },
      { filename: 'market/win_loss_24mo.pdf',          description: 'Win/loss analysis package',    required: true },
    ],
  };
}

function userGrowthDD(c: CompanyProfile): DiligenceDocumentSpec {
  return {
    kind: 'user_growth',
    title: 'User & growth diligence package',
    classification: 'sensitive',
    sections: [
      {
        heading: 'Growth mechanics',
        questions: [
          `ARR growth reconciliation (reported ${(c.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY)`,
          'Net new ARR bridge by source (new logo, expansion, contraction, churn)',
          'Channel mix and cost-per-channel evolution',
          'Sales cycle length by segment',
        ],
        evidence: ['ARR bridge', 'Channel waterfall', 'Pipeline by stage'],
      },
      {
        heading: 'Retention & expansion',
        questions: [
          'Gross retention, net retention by cohort and segment',
          'Churn taxonomy (voluntary, involuntary, downgrade)',
          'Expansion mechanics (seats, usage, modules)',
        ],
        evidence: ['Cohort retention curves', 'Churn root-cause analysis', 'Expansion playbook'],
      },
      {
        heading: 'Sales productivity',
        questions: [
          'Sales rep productivity and ramp curves',
          'Lead-to-opportunity-to-close ratios',
          'Channel partner contribution',
        ],
        evidence: ['Sales productivity dashboard', 'Quota attainment cohort', 'Partner agreements'],
      },
    ],
    artifacts: [
      { filename: 'growth/arr_bridge.xlsx',            description: 'ARR bridge by source',         required: true },
      { filename: 'growth/cohort_retention.xlsx',      description: 'Cohort retention curves',      required: true },
      { filename: 'growth/sales_productivity.xlsx',    description: 'Sales rep productivity',       required: false },
    ],
  };
}

function technicalArchitectureDD(c: CompanyProfile): DiligenceDocumentSpec {
  return {
    kind: 'technical_architecture',
    title: 'Technical architecture diligence',
    classification: 'confidential',
    sections: [
      {
        heading: 'System architecture',
        questions: [
          `Architecture diagram (${c.product.technicalArchitecture})`,
          'Service inventory and ownership map',
          'Data model and schema documentation',
          'Third-party dependencies and SLAs',
        ],
        evidence: ['Architecture diagrams', 'Service catalog', 'Dependency tree'],
      },
      {
        heading: 'Scalability & reliability',
        questions: [
          'Throughput at current scale + headroom analysis',
          'Latency SLOs and 99p performance',
          'Incident history (last 24 months) with MTTR',
          'Disaster recovery and RTO/RPO',
        ],
        evidence: ['Capacity plan', 'SLO dashboards', 'Postmortem library', 'DR runbook'],
      },
      {
        heading: 'Engineering posture',
        questions: [
          `Engineering headcount ${c.team.engineeringHeadcount ?? '—'}`,
          'CI/CD pipeline and deployment frequency',
          'Test coverage and quality posture',
          'On-call rotation and incident management',
        ],
        evidence: ['CI/CD config', 'Coverage report', 'On-call schedule'],
      },
    ],
    artifacts: [
      { filename: 'technical/architecture_overview.pdf', description: 'High-level architecture',   required: true },
      { filename: 'technical/service_catalog.xlsx',      description: 'Service inventory',         required: true },
      { filename: 'technical/incident_log_24mo.pdf',     description: 'Incident log',              required: true },
    ],
  };
}

function securityDD(_c: CompanyProfile): DiligenceDocumentSpec {
  return {
    kind: 'security',
    title: 'Security & compliance diligence',
    classification: 'confidential',
    sections: [
      {
        heading: 'Certifications',
        questions: [
          'SOC 2 Type II report (most recent)',
          'ISO 27001 certificate (if applicable)',
          'PCI-DSS, HIPAA, GDPR posture as relevant',
        ],
        evidence: ['SOC 2 audit', 'ISO 27001 cert', 'Compliance register'],
      },
      {
        heading: 'Security posture',
        questions: [
          'Penetration test report (last 12 months)',
          'Vulnerability management program',
          'Encryption posture (in transit, at rest, KMS)',
          'IAM and privileged access management',
        ],
        evidence: ['Pen test report', 'Vuln management dashboard', 'Encryption policy', 'IAM matrix'],
      },
      {
        heading: 'Incidents & breach history',
        questions: [
          'Security incident log (last 36 months)',
          'Breach notifications and regulatory engagements',
          'Customer-facing security disclosures',
        ],
        evidence: ['Security incident log', 'Breach disclosure register'],
      },
    ],
    artifacts: [
      { filename: 'security/soc2_type2_FY{n}.pdf',    description: 'SOC 2 Type II',          required: true },
      { filename: 'security/pentest_report.pdf',       description: 'Most recent pen test',   required: true },
      { filename: 'security/incident_log.pdf',         description: 'Security incident log',  required: true },
    ],
  };
}

function legalDD(_c: CompanyProfile): DiligenceDocumentSpec {
  return {
    kind: 'legal',
    title: 'Legal diligence package',
    classification: 'confidential',
    sections: [
      {
        heading: 'Corporate',
        questions: ['Articles, bylaws and stockholder agreements', 'Board minutes (last 36 months)', 'Material consents and waivers'],
        evidence: ['Charter documents', 'Minute book', 'Stockholder agreements'],
      },
      {
        heading: 'Material contracts',
        questions: ['Customer contracts above materiality threshold', 'Vendor contracts above materiality threshold', 'Channel and partner agreements'],
        evidence: ['Material contract index', 'Change-of-control review'],
      },
      {
        heading: 'Litigation & disputes',
        questions: ['Pending and threatened litigation', 'Regulatory investigations or inquiries', 'IP disputes'],
        evidence: ['Litigation register', 'Counsel memos'],
      },
    ],
    artifacts: [
      { filename: 'legal/charter_documents.pdf',       description: 'Articles, bylaws',          required: true },
      { filename: 'legal/material_contracts/index.pdf', description: 'Material contracts index',  required: true },
      { filename: 'legal/litigation_register.pdf',     description: 'Litigation register',       required: true },
    ],
  };
}

function commercialDD(c: CompanyProfile): DiligenceDocumentSpec {
  return {
    kind: 'commercial',
    title: 'Commercial diligence package',
    classification: 'sensitive',
    sections: [
      {
        heading: 'Customer references',
        questions: ['Top-20 customer NPS / health scores', 'Reference call list and consent', 'Customer interview themes'],
        evidence: ['NPS dashboard', 'Reference roster', 'Interview summary'],
      },
      {
        heading: 'Brand & narrative',
        questions: ['Press coverage register', 'Analyst positioning', 'Customer-facing case studies'],
        evidence: ['Press clippings', 'Analyst quadrant placement', 'Case-study library'],
      },
      {
        heading: 'Strategic value',
        questions: [
          c.product.hasDataMoat ? 'Data moat — corpus size, coverage, refresh cadence' : 'Data strategy',
          c.product.hasNetworkEffects ? 'Network effects — mechanics and density' : 'Network strategy',
          'Synergy thesis the buyer would underwrite',
        ],
        evidence: ['Data corpus overview', 'Network analysis', 'Synergy memo'],
      },
    ],
    artifacts: [
      { filename: 'commercial/nps_dashboard.pdf',       description: 'Customer health dashboard',  required: true },
      { filename: 'commercial/case_studies.pdf',        description: 'Case-study compilation',     required: true },
      { filename: 'commercial/synergy_memo.pdf',        description: 'Synergy thesis memo',        required: false },
    ],
  };
}

function criticalQuestions(c: CompanyProfile): readonly string[] {
  const q: string[] = [];
  if ((c.revenue.customerConcentrationTop10Pct ?? 0) > 0.5) q.push(`Top-10 concentration ${(c.revenue.customerConcentrationTop10Pct! * 100).toFixed(0)}% — what is the customer-retention plan post-close?`);
  if ((c.revenue.netRetentionPct ?? 1) < 1.0) q.push(`NRR ${((c.revenue.netRetentionPct ?? 1) * 100).toFixed(0)}% below 100% — what drives downgrades?`);
  if (c.market.regulatoryRisk === 'high') q.push('Regulatory regime — outline pending obligations and exposure.');
  if (c.team.leadershipBenchStrength === 'thin') q.push('Leadership succession — buyer will want a transition plan.');
  if (c.revenue.ebitdaMarginPct < 0) q.push(`Burn-rate at ${(c.revenue.ebitdaMarginPct * 100).toFixed(0)}% — outline path to profitability.`);
  return q;
}

function redFlags(c: CompanyProfile): readonly string[] {
  const rf: string[] = [];
  if ((c.revenue.customerConcentrationTop10Pct ?? 0) > 0.7) rf.push('Severe customer concentration (>70%)');
  if (c.revenue.grossMarginPct < 0.3) rf.push('Gross margin below 30% — investor concern');
  if ((c.revenue.netRetentionPct ?? 1) < 0.8) rf.push('NRR below 80% — buyers will discount aggressively');
  if (c.market.regulatoryRisk === 'high' && c.product.aiNative === true) rf.push('AI-native business + high regulatory risk — combine for elevated scrutiny');
  if (c.growth.arrGrowthYoyPct < 0) rf.push('ARR declining year-over-year');
  return rf;
}

export function runDueDiligence(company: CompanyProfile): DueDiligenceReport {
  return {
    meta: { engine: ENGINE, version: VERSION, runAt: new Date().toISOString() },
    company: company.name,
    documents: [
      financialDD(company),
      marketDD(company),
      userGrowthDD(company),
      technicalArchitectureDD(company),
      securityDD(company),
      legalDD(company),
      commercialDD(company),
    ],
    criticalQuestions: criticalQuestions(company),
    redFlags: redFlags(company),
  };
}
