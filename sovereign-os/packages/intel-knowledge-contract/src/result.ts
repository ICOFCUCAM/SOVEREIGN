import type { KnowledgeError, KnowledgeErrorCode } from './errors.js';
import { makeError } from './errors.js';

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: KnowledgeError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(
  code: KnowledgeErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): Result<T> {
  return { ok: false, error: makeError(code, message, details) };
}

export function isOk<T>(r: Result<T>): r is { ok: true; value: T } {
  return r.ok;
}

export function isErr<T>(r: Result<T>): r is { ok: false; error: KnowledgeError } {
  return !r.ok;
}

export function unwrap<T>(r: Result<T>): T {
  if (r.ok) return r.value;
  throw new Error(`${r.error.code}: ${r.error.message}`);
}

export function map<T, U>(r: Result<T>, f: (value: T) => U): Result<U> {
  return r.ok ? { ok: true, value: f(r.value) } : r;
}
