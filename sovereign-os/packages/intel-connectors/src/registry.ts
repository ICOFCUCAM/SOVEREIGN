import type { Connector } from '@sovereign/intel-core';
import { hackerNewsConnector } from './connectors/hacker-news.js';
import { rssConnector } from './connectors/rss.js';
import { gdeltDocConnector } from './connectors/gdelt-doc.js';
import { newsApiConnector } from './connectors/newsapi.js';
import { edgarConnector } from './connectors/edgar.js';
import { fredConnector } from './connectors/fred.js';
import { apifyConnector } from './connectors/apify.js';

// All connectors. Lookup by Connector.name. The runner reads
// intel_sources.connector to pick the right module.
//
// Sprint 1.2 (free, no auth):    hacker-news, rss, gdelt-doc
// Sprint 1.4 (paid + stakeholder): newsapi, edgar, fred, apify

export const CONNECTOR_REGISTRY: ReadonlyMap<string, Connector> = new Map([
  [hackerNewsConnector.name, hackerNewsConnector],
  [rssConnector.name,        rssConnector],
  [gdeltDocConnector.name,   gdeltDocConnector],
  [newsApiConnector.name,    newsApiConnector],
  [edgarConnector.name,      edgarConnector],
  [fredConnector.name,       fredConnector],
  [apifyConnector.name,      apifyConnector],
]);

export function lookupConnector(name: string): Connector | undefined {
  return CONNECTOR_REGISTRY.get(name);
}

export function listConnectors(): readonly Connector[] {
  return Array.from(CONNECTOR_REGISTRY.values());
}
