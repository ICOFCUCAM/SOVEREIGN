export { parseFeed } from './parse/rss.js';
export { stripHtml } from './parse/strip-html.js';

// Sprint 1.2 — free & open
export { hackerNewsConnector } from './connectors/hacker-news.js';
export { rssConnector, isRssConfig } from './connectors/rss.js';
export type { RssConfig } from './connectors/rss.js';
export { gdeltDocConnector, isGdeltConfig } from './connectors/gdelt-doc.js';
export type { GdeltConfig } from './connectors/gdelt-doc.js';

// Sprint 1.4 — paid & high-value
export { newsApiConnector, isNewsApiConfig } from './connectors/newsapi.js';
export type { NewsApiConfig } from './connectors/newsapi.js';
export { edgarConnector, isEdgarConfig } from './connectors/edgar.js';
export type { EdgarConfig } from './connectors/edgar.js';
export { fredConnector, isFredConfig } from './connectors/fred.js';
export type { FredConfig } from './connectors/fred.js';
export { apifyConnector, isApifyConfig } from './connectors/apify.js';
export type { ApifyConfig } from './connectors/apify.js';

export { CONNECTOR_REGISTRY, lookupConnector, listConnectors } from './registry.js';
export { persist, openIngestRun, closeIngestRun } from './normalizer.js';
export type { NormalizerContext, PersistOutcome } from './normalizer.js';
export { runSource, runEnabledSources } from './runner.js';
export type { RunSourceOptions, RunOutcome } from './runner.js';
export { rateLimitedFetch, isRateLimitPolicy, _resetRateLimitState } from './rate-limit.js';
export type { RateLimitPolicy, RateLimitedFetchOptions } from './rate-limit.js';
