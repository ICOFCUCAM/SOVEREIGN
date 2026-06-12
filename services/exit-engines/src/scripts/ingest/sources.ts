// ── SOURCE SEEDS ────────────────────────────────────────────────────
// Only names + canonical source pages. NO identifiers are hardcoded:
// QIDs resolve at runtime via the Wikidata search API, CIKs via the SEC
// company_tickers.json index — the pipeline cannot ship a wrong ID
// because it never invents one.

/** Primary Wikipedia acquisition-list pages (user-specified). */
export const PRIMARY_LIST_PAGES = [
  'List_of_mergers_and_acquisitions_by_Microsoft',
  'List_of_acquisitions_by_Oracle',
  'List_of_acquisitions_by_Cisco',
  'List_of_acquisitions_by_Adobe',
  'List_of_acquisitions_by_AOL',
  'List_of_acquisitions_by_Accenture',
] as const;

/** Master index — crawled at runtime to enumerate every
 *  "List of (mergers and )acquisitions by X" page Wikipedia maintains. */
export const MASTER_INDEX_PAGE = 'Lists_of_corporate_mergers_and_acquisitions';

/** Sovereign wealth funds list (Wikipedia mirror of the SWFI ranking —
 *  swfinstitute.org actively blocks automated access; the Wikipedia list
 *  carries the same funds with citations). */
export const SWF_LIST_PAGE = 'List_of_sovereign_wealth_funds';

/** Corporate acquirers to register + resolve (user-specified). */
export const CORPORATE_ACQUIRERS = [
  'Microsoft', 'Cisco', 'Oracle', 'Adobe', 'IBM', 'SAP', 'Salesforce', 'Amazon',
  'Google', 'Meta Platforms', 'Apple', 'ServiceNow', 'HubSpot', 'Atlassian',
  'Twilio', 'Snowflake', 'Datadog', 'Intuit', 'PayPal', 'Block, Inc.', 'Shopify', 'Workday',
  'AOL', 'Accenture',
] as const;

/** Private-equity acquirers to register + resolve (user-specified). */
export const PRIVATE_EQUITY_ACQUIRERS = [
  'Vista Equity Partners', 'Thoma Bravo', 'KKR', 'Blackstone Inc.', 'Carlyle Group',
  'TPG Inc.', 'Bain Capital', 'Warburg Pincus', 'Insight Partners', 'Silver Lake',
  'Hg Capital', 'Francisco Partners', 'EQT AB', 'Permira', 'Apax Partners', 'Advent International',
] as const;
