import type { KnowledgeProvider } from './contract.js';
import type { ProviderHealth } from './types.js';
import { err } from './result.js';
import { CONTRACT_NAME, CONTRACT_VERSION } from './version.js';

// Default provider returned when no implementation is configured.
// Every capability call resolves to { ok: false, error: { code: 'no_provider' }}.
// Call sites use this to degrade explicitly — surfacing "doctrine
// unavailable" in briefings, banners in the console, etc.

const NO_PROVIDER_MSG = 'No knowledge provider is configured for this deployment.';
const noProvider = <T>() => err<T>('no_provider', NO_PROVIDER_MSG);

export const NoProvider: KnowledgeProvider = {
  meta: {
    contract: CONTRACT_NAME,
    version: CONTRACT_VERSION,
    implementation: 'no-provider',
    implementationVersion: '0.1.0',
  },

  async health(): Promise<ProviderHealth> {
    return { status: 'down', checkedAt: new Date().toISOString(), details: { reason: 'no_provider' } };
  },

  documents: {
    async retrieve()        { return noProvider(); },
    async list()            { return noProvider(); },
    async resolveExcerpt()  { return noProvider(); },
  },
  reference: {
    async search()          { return noProvider(); },
    async similarTo()       { return noProvider(); },
    async groundedAnswer()  { return noProvider(); },
  },
  doctrine: {
    async doctrineFor()     { return noProvider(); },
    async precedentFor()    { return noProvider(); },
  },
  graph: {
    async resolve()         { return noProvider(); },
    async neighbours()      { return noProvider(); },
    async relationship()    { return noProvider(); },
  },
  memory: {
    async recordEvent()     { return noProvider(); },
    async recordDecision()  { return noProvider(); },
    async recordOutcome()   { return noProvider(); },
  },
  governance: {
    async classify()        { return noProvider(); },
    async accessFor()       { return noProvider(); },
    async auditTrail()      { return noProvider(); },
  },
};
