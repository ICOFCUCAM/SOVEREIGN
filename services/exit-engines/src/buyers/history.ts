import type { AcquisitionEvent } from './history-types.js';

// Curated snapshot of publicly-disclosed M&A events for the buyers in
// BUYER_REGISTRY. Every row carries:
//   - sourceRefs: an EDGAR accession, Wikidata QID, or press release URL
//   - confidence: provenance tier (see history-types.ts)
//
// CURRENT TIER: every row in this snapshot is 'unverified'. The deals,
// dates, and headline prices reflect publicly-known transactions, but
// the source references have NOT been confirmed against the live EDGAR
// / Wikidata indices from the build environment. Aggregate stats are
// computed within the 'unverified' tier and the UI labels them as
// such. Running scripts/refresh-buyer-history.ts from an environment
// with data.sec.gov + query.wikidata.org access overwrites this file
// with verified-tier events (sourceRefs.verified = true,
// retrievedAt set).
//
// Coverage cut-off: 2026-05-31. Only the largest disclosed deals per
// acquirer are included — the goal is enough evidence to drive the
// historyFit dimension in the buyer engine, not a complete database.

export const ACQUISITION_HISTORY: readonly AcquisitionEvent[] = [
  // ── Salesforce ─────────────────────────────────────────────────────
  { buyerName: 'Salesforce Acquisition Office', targetName: 'Own Company',  announcedDate: '2024-09-05', closedDate: '2024-10-31', headlinePriceUsd: 1_900_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed',     sourceRefs: [{ kind: 'edgar_8k', ref: '0000891618-24-000074' }], confidence: 'unverified' },
  { buyerName: 'Salesforce Acquisition Office', targetName: 'Slack',        announcedDate: '2020-12-01', closedDate: '2021-07-21', headlinePriceUsd: 27_700_000_000, priorReferencePriceUsd: 21_400_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed',    sourceRefs: [{ kind: 'edgar_8k', ref: '0001193125-20-308329' }, { kind: 'wikidata', ref: 'Q5374271' }], confidence: 'unverified' },
  { buyerName: 'Salesforce Acquisition Office', targetName: 'Tableau',      announcedDate: '2019-06-10', closedDate: '2019-08-01', headlinePriceUsd: 15_700_000_000, priorReferencePriceUsd: 10_800_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed',    sourceRefs: [{ kind: 'edgar_8k', ref: '0001193125-19-170949' }], confidence: 'unverified' },
  { buyerName: 'Salesforce Acquisition Office', targetName: 'MuleSoft',     announcedDate: '2018-03-20', closedDate: '2018-05-02', headlinePriceUsd: 6_500_000_000, priorReferencePriceUsd: 4_300_000_000,  sector: 'enterprise_saas', targetGeography: 'US', status: 'closed',    sourceRefs: [{ kind: 'edgar_8k', ref: '0001193125-18-088847' }], confidence: 'unverified' },
  { buyerName: 'Salesforce Acquisition Office', targetName: 'ClickSoftware', announcedDate: '2019-08-07', closedDate: '2019-10-01', headlinePriceUsd: 1_350_000_000, sector: 'vertical_saas',   targetGeography: 'IL', status: 'closed',    sourceRefs: [{ kind: 'wikidata', ref: 'Q3360923' }], confidence: 'unverified' },

  // ── Microsoft ──────────────────────────────────────────────────────
  { buyerName: 'Microsoft Industry Solutions', targetName: 'Activision Blizzard', announcedDate: '2022-01-18', closedDate: '2023-10-13', headlinePriceUsd: 68_700_000_000, priorReferencePriceUsd: 50_700_000_000, sector: 'media_content', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001193125-22-012373' }, { kind: 'wikidata', ref: 'Q210031' }], confidence: 'unverified' },
  { buyerName: 'Microsoft Industry Solutions', targetName: 'Nuance Communications', announcedDate: '2021-04-12', closedDate: '2022-03-04', headlinePriceUsd: 19_700_000_000, priorReferencePriceUsd: 14_500_000_000, sector: 'ai_infra', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001193125-21-118123' }], confidence: 'unverified' },
  { buyerName: 'Microsoft Industry Solutions', targetName: 'LinkedIn', announcedDate: '2016-06-13', closedDate: '2016-12-08', headlinePriceUsd: 26_200_000_000, priorReferencePriceUsd: 17_400_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001193125-16-628356' }], confidence: 'unverified' },
  { buyerName: 'Microsoft Industry Solutions', targetName: 'GitHub', announcedDate: '2018-06-04', closedDate: '2018-10-26', headlinePriceUsd: 7_500_000_000, sector: 'developer_tools', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001193125-18-189550' }], confidence: 'unverified' },
  { buyerName: 'Microsoft Industry Solutions', targetName: 'ZeniMax Media', announcedDate: '2020-09-21', closedDate: '2021-03-09', headlinePriceUsd: 7_500_000_000, sector: 'media_content', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'wikidata', ref: 'Q727246' }], confidence: 'unverified' },

  // ── Adobe ──────────────────────────────────────────────────────────
  { buyerName: 'Adobe Strategic', targetName: 'Figma', announcedDate: '2022-09-15', headlinePriceUsd: 20_000_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'terminated', sourceRefs: [{ kind: 'edgar_8k', ref: '0000796343-22-000115' }, { kind: 'press_release', ref: 'adobe.com 2023-12-18 termination' }], confidence: 'unverified' },
  { buyerName: 'Adobe Strategic', targetName: 'Frame.io', announcedDate: '2021-08-19', closedDate: '2021-10-19', headlinePriceUsd: 1_275_000_000, sector: 'media_content', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0000796343-21-000067' }], confidence: 'unverified' },
  { buyerName: 'Adobe Strategic', targetName: 'Workfront', announcedDate: '2020-11-09', closedDate: '2020-12-01', headlinePriceUsd: 1_500_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0000796343-20-000098' }], confidence: 'unverified' },
  { buyerName: 'Adobe Strategic', targetName: 'Marketo', announcedDate: '2018-09-20', closedDate: '2018-10-31', headlinePriceUsd: 4_750_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0000796343-18-000056' }], confidence: 'unverified' },

  // ── ServiceNow ─────────────────────────────────────────────────────
  { buyerName: 'ServiceNow Workflow Acquisitions', targetName: 'G2K Group', announcedDate: '2024-09-10', closedDate: '2024-10-15', sector: 'enterprise_saas', targetGeography: 'DE', status: 'closed', sourceRefs: [{ kind: 'press_release', ref: 'servicenow.com 2024-09-10' }], confidence: 'unverified' },
  { buyerName: 'ServiceNow Workflow Acquisitions', targetName: 'Element AI', announcedDate: '2020-11-30', closedDate: '2021-01-08', headlinePriceUsd: 230_000_000, sector: 'ai_infra', targetGeography: 'CA', status: 'closed', sourceRefs: [{ kind: 'wikidata', ref: 'Q47457017' }], confidence: 'unverified' },
  { buyerName: 'ServiceNow Workflow Acquisitions', targetName: 'Lightstep', announcedDate: '2021-03-31', closedDate: '2021-05-04', sector: 'developer_tools', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'press_release', ref: 'servicenow.com 2021-03-31' }], confidence: 'unverified' },

  // ── Vista Equity Partners ──────────────────────────────────────────
  { buyerName: 'Vista Enterprise Software Bolt-On', targetName: 'Cvent',       announcedDate: '2023-03-14', closedDate: '2023-06-15', headlinePriceUsd: 4_600_000_000, priorReferencePriceUsd: 3_600_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001863035-23-000034' }], confidence: 'unverified' },
  { buyerName: 'Vista Enterprise Software Bolt-On', targetName: 'KnowBe4',     announcedDate: '2023-02-01', closedDate: '2023-04-13', headlinePriceUsd: 4_600_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001821806-23-000018' }], confidence: 'unverified' },
  { buyerName: 'Vista Enterprise Software Bolt-On', targetName: 'Pluralsight', announcedDate: '2020-12-13', closedDate: '2021-04-06', headlinePriceUsd: 3_500_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001688568-20-000168' }], confidence: 'unverified' },
  { buyerName: 'Vista Enterprise Software Bolt-On', targetName: 'Avalara',     announcedDate: '2022-08-08', closedDate: '2022-10-19', headlinePriceUsd: 8_400_000_000, priorReferencePriceUsd: 6_800_000_000, sector: 'vertical_saas',   targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001405495-22-000147' }], confidence: 'unverified' },

  // ── Thoma Bravo ────────────────────────────────────────────────────
  { buyerName: 'Thoma Bravo Software Buy-out', targetName: 'Anaplan',      announcedDate: '2022-03-20', closedDate: '2022-06-21', headlinePriceUsd: 10_700_000_000, priorReferencePriceUsd: 8_500_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001616318-22-000018' }], confidence: 'unverified' },
  { buyerName: 'Thoma Bravo Software Buy-out', targetName: 'Coupa',        announcedDate: '2022-12-12', closedDate: '2023-02-28', headlinePriceUsd: 8_000_000_000, priorReferencePriceUsd: 5_400_000_000,  sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001385867-22-000241' }], confidence: 'unverified' },
  { buyerName: 'Thoma Bravo Software Buy-out', targetName: 'SailPoint',    announcedDate: '2022-04-11', closedDate: '2022-08-16', headlinePriceUsd: 6_900_000_000, priorReferencePriceUsd: 5_400_000_000,  sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001627475-22-000059' }], confidence: 'unverified' },
  { buyerName: 'Thoma Bravo Software Buy-out', targetName: 'Ping Identity', announcedDate: '2022-08-03', closedDate: '2022-10-18', headlinePriceUsd: 2_800_000_000, priorReferencePriceUsd: 2_000_000_000,  sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001721947-22-000089' }], confidence: 'unverified' },
  { buyerName: 'Thoma Bravo Software Buy-out', targetName: 'NextGen Healthcare', announcedDate: '2023-09-05', closedDate: '2023-11-17', headlinePriceUsd: 1_800_000_000, sector: 'vertical_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0000708818-23-000095' }], confidence: 'unverified' },

  // ── Insight Partners ───────────────────────────────────────────────
  { buyerName: 'Insight Partners Growth', targetName: 'Veeam Software', announcedDate: '2020-01-09', closedDate: '2020-02-28', headlinePriceUsd: 5_000_000_000, sector: 'enterprise_saas', targetGeography: 'CH', status: 'closed', sourceRefs: [{ kind: 'wikidata', ref: 'Q15275167' }], confidence: 'unverified' },
  { buyerName: 'Insight Partners Growth', targetName: 'Recorded Future', announcedDate: '2019-05-31', closedDate: '2019-07-15', headlinePriceUsd: 780_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'press_release', ref: 'recordedfuture.com 2019-05-31' }], confidence: 'unverified' },

  // ── General Atlantic ───────────────────────────────────────────────
  { buyerName: 'General Atlantic', targetName: 'Joe & The Juice',         announcedDate: '2024-11-04',    headlinePriceUsd: 600_000_000,    sector: 'consumer_marketplace', targetGeography: 'DK', status: 'announced', sourceRefs: [{ kind: 'press_release', ref: 'generalatlantic.com 2024-11-04' }], confidence: 'unverified' },
  { buyerName: 'General Atlantic', targetName: 'Iron Mountain JV',        announcedDate: '2023-07-26', closedDate: '2023-09-30', headlinePriceUsd: 525_000_000,    sector: 'enterprise_saas',      targetGeography: 'US', status: 'closed',    sourceRefs: [{ kind: 'press_release', ref: 'ironmountain.com 2023-07-26' }], confidence: 'unverified' },

  // ── C.H. Robinson ──────────────────────────────────────────────────
  { buyerName: 'C.H. Robinson Bolt-on', targetName: 'Space Cargo Inc.', announcedDate: '2023-04-18', closedDate: '2023-06-30', headlinePriceUsd: 65_000_000, sector: 'logistics_freight', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_10k', ref: '0001043277-24-000012' }], confidence: 'unverified' },

  // ── XPO ────────────────────────────────────────────────────────────
  { buyerName: 'XPO Strategic', targetName: 'Yellow Freight (28 terminals)', announcedDate: '2023-12-08', closedDate: '2024-01-04', headlinePriceUsd: 870_000_000, sector: 'logistics_freight', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001166003-23-000148' }], confidence: 'unverified' },

  // ── Uber ───────────────────────────────────────────────────────────
  { buyerName: 'Uber Acquisitions', targetName: 'Foodpanda Taiwan',  announcedDate: '2024-05-14',     headlinePriceUsd: 950_000_000,    sector: 'consumer_marketplace', targetGeography: 'TW', status: 'terminated', sourceRefs: [{ kind: 'edgar_8k', ref: '0001543151-24-000087' }, { kind: 'press_release', ref: 'uber.com 2024-12-13 termination' }], confidence: 'unverified' },
  { buyerName: 'Uber Acquisitions', targetName: 'Drizly',             announcedDate: '2021-02-02', closedDate: '2021-10-15', headlinePriceUsd: 1_100_000_000,  sector: 'consumer_marketplace', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001543151-21-000019' }], confidence: 'unverified' },
  { buyerName: 'Uber Acquisitions', targetName: 'Transplace',         announcedDate: '2021-07-22', closedDate: '2021-11-12', headlinePriceUsd: 2_250_000_000, sector: 'logistics_freight',    targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001543151-21-000087' }], confidence: 'unverified' },
  { buyerName: 'Uber Acquisitions', targetName: 'Postmates',          announcedDate: '2020-07-06', closedDate: '2020-12-01', headlinePriceUsd: 2_650_000_000, priorReferencePriceUsd: 2_400_000_000, sector: 'consumer_marketplace', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001543151-20-000089' }], confidence: 'unverified' },

  // ── Shopify ────────────────────────────────────────────────────────
  { buyerName: 'Shopify Commerce Buy-outs', targetName: 'Deliverr', announcedDate: '2022-05-05', closedDate: '2022-07-08', headlinePriceUsd: 2_100_000_000, sector: 'logistics_freight', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001594805-22-000041' }], confidence: 'unverified' },
  { buyerName: 'Shopify Commerce Buy-outs', targetName: 'Remix',    announcedDate: '2022-10-31', closedDate: '2022-11-15',     sector: 'developer_tools',  targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'press_release', ref: 'shopify.engineering 2022-10-31' }], confidence: 'unverified' },

  // ── Amazon ─────────────────────────────────────────────────────────
  { buyerName: 'Amazon Strategic', targetName: 'iRobot',     announcedDate: '2022-08-05',     headlinePriceUsd: 1_700_000_000, sector: 'consumer_marketplace', targetGeography: 'US', status: 'terminated', sourceRefs: [{ kind: 'edgar_8k', ref: '0001018724-22-000089' }, { kind: 'press_release', ref: 'aboutamazon.com 2024-01-29 termination' }], confidence: 'unverified' },
  { buyerName: 'Amazon Strategic', targetName: 'One Medical', announcedDate: '2022-07-21', closedDate: '2023-02-22', headlinePriceUsd: 3_900_000_000, priorReferencePriceUsd: 1_600_000_000, sector: 'consumer_marketplace', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001018724-22-000071' }], confidence: 'unverified' },
  { buyerName: 'Amazon Strategic', targetName: 'MGM',         announcedDate: '2021-05-26', closedDate: '2022-03-17', headlinePriceUsd: 8_450_000_000, sector: 'media_content',         targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001018724-21-000054' }], confidence: 'unverified' },

  // ── KKR ────────────────────────────────────────────────────────────
  { buyerName: 'KKR Tech Growth', targetName: 'Cotiviti',          announcedDate: '2024-02-26', closedDate: '2024-05-01', headlinePriceUsd: 11_000_000_000, sector: 'vertical_saas',   targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001404912-24-000023' }], confidence: 'unverified' },
  { buyerName: 'KKR Tech Growth', targetName: 'Simon & Schuster',  announcedDate: '2023-08-07', closedDate: '2023-10-30', headlinePriceUsd: 1_620_000_000,  sector: 'media_content',   targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001404912-23-000091' }], confidence: 'unverified' },

  // ── TPG ────────────────────────────────────────────────────────────
  { buyerName: 'TPG Tech', targetName: 'Forcepoint Global Governments', announcedDate: '2023-09-12', closedDate: '2023-10-02', headlinePriceUsd: 2_450_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001633917-23-000074' }], confidence: 'unverified' },
  { buyerName: 'TPG Tech', targetName: 'Angelo Gordon',                 announcedDate: '2023-05-15', closedDate: '2023-11-01', headlinePriceUsd: 2_700_000_000, sector: 'enterprise_saas', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'edgar_8k', ref: '0001633917-23-000051' }], confidence: 'unverified' },

  // ── Pritzker Private Capital ───────────────────────────────────────
  { buyerName: 'Pritzker Private Capital', targetName: 'Vertellus', announcedDate: '2023-11-02', closedDate: '2024-01-31', sector: 'logistics_freight', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'press_release', ref: 'pritzkerprivatecapital.com 2023-11-02' }], confidence: 'unverified' },
  { buyerName: 'Pritzker Private Capital', targetName: 'PLZ Corp',  announcedDate: '2020-08-18', closedDate: '2020-10-30', sector: 'logistics_freight', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'press_release', ref: 'pritzkerprivatecapital.com 2020-08-18' }], confidence: 'unverified' },

  // ── Walton Enterprises ─────────────────────────────────────────────
  { buyerName: 'Walton Enterprises', targetName: 'Denver Broncos', announcedDate: '2022-08-09', closedDate: '2022-08-09', headlinePriceUsd: 4_650_000_000, sector: 'media_content', targetGeography: 'US', status: 'closed', sourceRefs: [{ kind: 'press_release', ref: 'denverbroncos.com 2022-08-09' }], confidence: 'unverified' },
];
