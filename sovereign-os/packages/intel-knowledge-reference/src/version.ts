export const IMPLEMENTATION_NAME = 'intel-knowledge-reference' as const;
export const IMPLEMENTATION_VERSION = '0.1.0' as const;

// Honest disclaimer surfaced by the provider — this is a reference
// implementation, not a production knowledge substrate. Veritas OS is
// the chartered production owner of Tier 00.
export const REFERENCE_DISCLAIMER =
  'Reference provider — lexical retrieval, in-memory store by default. ' +
  'Use @sovereign/intel-knowledge-reference for development and integration ' +
  'testing only. Production deployments must run Veritas OS.';
