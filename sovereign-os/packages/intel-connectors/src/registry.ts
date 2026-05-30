import type { Connector } from '@sovereign/intel-core';
import { hackerNewsConnector } from './connectors/hacker-news.js';
import { rssConnector } from './connectors/rss.js';
import { gdeltDocConnector } from './connectors/gdelt-doc.js';

// All connectors landed in Sprint 1.2. Lookup by Connector.name. The
// runner reads intel_sources.connector to pick the right module.

export const CONNECTOR_REGISTRY: ReadonlyMap<string, Connector> = new Map([
  [hackerNewsConnector.name, hackerNewsConnector],
  [rssConnector.name,        rssConnector],
  [gdeltDocConnector.name,   gdeltDocConnector],
]);

export function lookupConnector(name: string): Connector | undefined {
  return CONNECTOR_REGISTRY.get(name);
}

export function listConnectors(): readonly Connector[] {
  return Array.from(CONNECTOR_REGISTRY.values());
}
