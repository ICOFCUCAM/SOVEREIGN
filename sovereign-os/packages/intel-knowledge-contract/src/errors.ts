// Contract error codes. Every result the provider returns either
// succeeds or fails with one of these — callers must handle each.

export type KnowledgeErrorCode =
  | 'no_provider'
  | 'not_found'
  | 'unauthenticated'
  | 'access_denied'
  | 'classification_too_high'
  | 'jurisdiction_mismatch'
  | 'stale_doctrine'
  | 'provider_unavailable'
  | 'provider_timeout'
  | 'rate_limited'
  | 'invalid_argument'
  | 'unsupported_capability'
  | 'internal_error';

export interface KnowledgeError {
  readonly code: KnowledgeErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
}

export const RETRYABLE_CODES: ReadonlySet<KnowledgeErrorCode> = new Set([
  'provider_unavailable',
  'provider_timeout',
  'rate_limited',
  'internal_error',
]);

export function makeError(
  code: KnowledgeErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): KnowledgeError {
  return {
    code,
    message,
    retryable: RETRYABLE_CODES.has(code),
    ...(details !== undefined ? { details } : {}),
  };
}

export function isKnowledgeError(value: unknown): value is KnowledgeError {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.code === 'string'
    && typeof v.message === 'string'
    && typeof v.retryable === 'boolean';
}
