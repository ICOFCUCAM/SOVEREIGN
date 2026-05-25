/**
 * Institution blueprint generator (deterministic, by category).
 *
 * Reframes a domain from "name for sale" into a deployable sovereign
 * institution: capabilities, operational systems, deployment zones, and an
 * architecture stack. Pure data — the UI renders it as a cinematic preview
 * and clearly labels simulated operational figures as previews.
 */

export interface Capability { label: string; icon: string }
export interface InstitutionSystem { name: string; status: 'live' | 'staged' | 'arming'; metricLabel: string; metricValue: string }
export interface InstitutionBlueprint {
  type: string;
  thesis: string;
  capabilities: Capability[];
  systems: InstitutionSystem[];
  zones: string[];
  architecture: string[];
  kpis: Array<{ label: string; value: string }>;
}

type Blueprint = Omit<InstitutionBlueprint, 'thesis'> & { thesis: (name: string) => string };

const BLUEPRINTS: Record<string, Blueprint> = {
  govtech: {
    type: 'Sovereign Governance Intelligence Infrastructure',
    thesis: (n) => `${n} is the coordination layer for a digital state — ministries, citizen services, and oversight unified under one sovereign command plane.`,
    capabilities: [
      { label: 'Ministry orchestration', icon: 'landmark' },
      { label: 'Citizen services', icon: 'users' },
      { label: 'AI compliance monitoring', icon: 'fileCheck' },
      { label: 'National analytics', icon: 'activity' },
      { label: 'Election intelligence', icon: 'vote' },
      { label: 'Anti-corruption integration', icon: 'scale' },
      { label: 'Secure deployment zones', icon: 'lock' },
    ],
    systems: [
      { name: 'Ministry Orchestrator', status: 'live', metricLabel: 'Agencies', metricValue: '38' },
      { name: 'Citizen Service Mesh', status: 'live', metricLabel: 'Requests / day', metricValue: '1.2M' },
      { name: 'Compliance Sentinel', status: 'arming', metricLabel: 'Flags resolved', metricValue: '99.4%' },
      { name: 'National Analytics Core', status: 'staged', metricLabel: 'Signals', metricValue: '4.8B' },
    ],
    zones: ['Capital', 'Northern', 'Coastal', 'Federal DMZ', 'Continuity Site'],
    architecture: ['Citizen edge gateway', 'Ministry orchestration', 'Sovereign data fabric', 'Compliance & audit plane', 'Hardened deployment zone'],
    kpis: [{ label: 'Coordination', value: '98.7%' }, { label: 'Throughput', value: '1.2M/d' }, { label: 'Uptime', value: '99.99%' }, { label: 'Regions', value: '14' }],
  },
  fintech: {
    type: 'Sovereign Financial & Treasury Infrastructure',
    thesis: (n) => `${n} is the rails for sovereign-grade money movement — treasury, payments, and compliance engineered for institutional scale.`,
    capabilities: [
      { label: 'Payment orchestration', icon: 'banknote' },
      { label: 'Treasury intelligence', icon: 'coins' },
      { label: 'Real-time settlement', icon: 'activity' },
      { label: 'Fraud & risk AI', icon: 'shield' },
      { label: 'Embedded banking APIs', icon: 'network' },
      { label: 'Regulatory compliance', icon: 'fileCheck' },
      { label: 'Multi-region custody', icon: 'lock' },
    ],
    systems: [
      { name: 'Settlement Engine', status: 'live', metricLabel: 'Volume / day', metricValue: '$840M' },
      { name: 'Treasury Core', status: 'live', metricLabel: 'Yield', metricValue: '4.8%' },
      { name: 'Risk Sentinel', status: 'arming', metricLabel: 'Fraud caught', metricValue: '99.2%' },
      { name: 'Compliance Ledger', status: 'staged', metricLabel: 'Jurisdictions', metricValue: '27' },
    ],
    zones: ['Primary', 'EU residency', 'APAC', 'Custody vault', 'DR site'],
    architecture: ['Client + partner APIs', 'Payment orchestration', 'Ledger & settlement core', 'Risk & compliance plane', 'Custody & key management'],
    kpis: [{ label: 'Settled', value: '$840M/d' }, { label: 'Latency', value: '120ms' }, { label: 'Uptime', value: '99.99%' }, { label: 'Regions', value: '12' }],
  },
  ai: {
    type: 'AI-Native Intelligence Infrastructure',
    thesis: (n) => `${n} is the intelligence layer enterprises build on — models, agents, and orchestration delivered as sovereign infrastructure.`,
    capabilities: [
      { label: 'Model orchestration', icon: 'cpu' },
      { label: 'Agent fabric', icon: 'network' },
      { label: 'Inference at the edge', icon: 'server' },
      { label: 'Evaluation & safety', icon: 'shield' },
      { label: 'Knowledge grounding', icon: 'database' },
      { label: 'Observability', icon: 'gauge' },
      { label: 'Private deployment', icon: 'lock' },
    ],
    systems: [
      { name: 'Inference Mesh', status: 'live', metricLabel: 'Tokens / day', metricValue: '38B' },
      { name: 'Agent Orchestrator', status: 'live', metricLabel: 'Active agents', metricValue: '4.2k' },
      { name: 'Eval & Safety', status: 'arming', metricLabel: 'Pass rate', metricValue: '98.1%' },
      { name: 'Knowledge Core', status: 'staged', metricLabel: 'Indexed docs', metricValue: '1.1B' },
    ],
    zones: ['US-East', 'EU-Central', 'APAC', 'Private VPC', 'Air-gapped'],
    architecture: ['Application + agent layer', 'Model orchestration', 'Inference runtime', 'Knowledge & vector fabric', 'Private GPU zone'],
    kpis: [{ label: 'Throughput', value: '38B tok/d' }, { label: 'p95 latency', value: '210ms' }, { label: 'Uptime', value: '99.98%' }, { label: 'Regions', value: '9' }],
  },
  logistics: {
    type: 'Sovereign Logistics & Mobility Infrastructure',
    thesis: (n) => `${n} is the operating system for movement — fleets, routing, and supply intelligence across a nation's physical economy.`,
    capabilities: [
      { label: 'Fleet orchestration', icon: 'truck' },
      { label: 'Route intelligence', icon: 'radar' },
      { label: 'Supply analytics', icon: 'activity' },
      { label: 'Live tracking mesh', icon: 'network' },
      { label: 'Demand forecasting', icon: 'gauge' },
      { label: 'Border & customs ops', icon: 'fileCheck' },
      { label: 'Secure depots', icon: 'lock' },
    ],
    systems: [
      { name: 'Fleet Orchestrator', status: 'live', metricLabel: 'Vehicles', metricValue: '12.4k' },
      { name: 'Route Intelligence', status: 'live', metricLabel: 'On-time', metricValue: '97.3%' },
      { name: 'Demand Engine', status: 'arming', metricLabel: 'Forecast acc.', metricValue: '94%' },
      { name: 'Customs Bridge', status: 'staged', metricLabel: 'Corridors', metricValue: '31' },
    ],
    zones: ['National hub', 'Regional depots', 'Port gateway', 'Cross-border', 'Cold chain'],
    architecture: ['Driver + partner apps', 'Dispatch orchestration', 'Routing & optimization core', 'Telemetry & tracking mesh', 'Depot & edge zone'],
    kpis: [{ label: 'Fleet', value: '12.4k' }, { label: 'On-time', value: '97.3%' }, { label: 'Uptime', value: '99.97%' }, { label: 'Corridors', value: '31' }],
  },
  education: {
    type: 'Sovereign Education & Credentialing Infrastructure',
    thesis: (n) => `${n} is the learning backbone of a nation — institutions, credentials, and adaptive intelligence unified for every citizen.`,
    capabilities: [
      { label: 'Institution orchestration', icon: 'landmark' },
      { label: 'Adaptive learning AI', icon: 'cpu' },
      { label: 'Verifiable credentials', icon: 'fileCheck' },
      { label: 'National curriculum', icon: 'database' },
      { label: 'Outcomes analytics', icon: 'activity' },
      { label: 'Educator tooling', icon: 'users' },
      { label: 'Secure records', icon: 'lock' },
    ],
    systems: [
      { name: 'Institution Mesh', status: 'live', metricLabel: 'Schools', metricValue: '4.1k' },
      { name: 'Adaptive Engine', status: 'live', metricLabel: 'Learners', metricValue: '2.8M' },
      { name: 'Credential Ledger', status: 'arming', metricLabel: 'Issued', metricValue: '11M' },
      { name: 'Outcomes Core', status: 'staged', metricLabel: 'Completion', metricValue: '+18%' },
    ],
    zones: ['National', 'Regional', 'Rural mesh', 'Records vault', 'DR site'],
    architecture: ['Learner + educator apps', 'Institution orchestration', 'Adaptive learning core', 'Credential & records fabric', 'Secure data zone'],
    kpis: [{ label: 'Learners', value: '2.8M' }, { label: 'Schools', value: '4.1k' }, { label: 'Uptime', value: '99.98%' }, { label: 'Regions', value: '14' }],
  },
  general: {
    type: 'Sovereign Operational Infrastructure',
    thesis: (n) => `${n} is deployable institutional infrastructure — operations, intelligence, and deployment unified under one command plane.`,
    capabilities: [
      { label: 'Operations orchestration', icon: 'network' },
      { label: 'Intelligence analytics', icon: 'activity' },
      { label: 'Workflow automation', icon: 'cpu' },
      { label: 'Identity & access', icon: 'users' },
      { label: 'Compliance tooling', icon: 'fileCheck' },
      { label: 'Observability', icon: 'gauge' },
      { label: 'Secure deployment', icon: 'lock' },
    ],
    systems: [
      { name: 'Operations Core', status: 'live', metricLabel: 'Workflows', metricValue: '1.4k' },
      { name: 'Intelligence Layer', status: 'live', metricLabel: 'Signals', metricValue: '320M' },
      { name: 'Automation Engine', status: 'arming', metricLabel: 'Automated', metricValue: '92%' },
      { name: 'Access Plane', status: 'staged', metricLabel: 'Identities', metricValue: '180k' },
    ],
    zones: ['Primary', 'Secondary', 'Edge mesh', 'Data vault', 'DR site'],
    architecture: ['Client applications', 'Operations orchestration', 'Intelligence & data core', 'Identity & compliance plane', 'Secure deployment zone'],
    kpis: [{ label: 'Workflows', value: '1.4k' }, { label: 'Automated', value: '92%' }, { label: 'Uptime', value: '99.98%' }, { label: 'Regions', value: '10' }],
  },
};

const CATEGORY_ALIASES: Record<string, keyof typeof BLUEPRINTS> = {
  govtech: 'govtech', gov: 'govtech', government: 'govtech',
  fintech: 'fintech', finance: 'fintech', banking: 'fintech', payments: 'fintech',
  ai: 'ai', 'artificial intelligence': 'ai', ml: 'ai',
  logistics: 'logistics', transport: 'logistics', mobility: 'logistics', supply: 'logistics',
  education: 'education', edtech: 'education', edu: 'education',
  infra: 'general', saas: 'general', data: 'general',
};

export function institutionBlueprint(domainName: string, category?: string): InstitutionBlueprint {
  const root = domainName.split('.')[0];
  const name = root.charAt(0).toUpperCase() + root.slice(1);
  const key = CATEGORY_ALIASES[(category || '').toLowerCase()] || 'general';
  const bp = BLUEPRINTS[key];
  return { ...bp, thesis: bp.thesis(name) };
}
