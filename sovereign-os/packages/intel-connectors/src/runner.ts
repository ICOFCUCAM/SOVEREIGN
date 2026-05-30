import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConnectorContext, ConnectorLogger, SourceRecord } from '@sovereign/intel-core';
import { consoleLogger } from '@sovereign/intel-core';
import { lookupConnector } from './registry.js';
import { closeIngestRun, openIngestRun, persist, type PersistOutcome } from './normalizer.js';

export interface RunSourceOptions {
  readonly supabase: SupabaseClient;
  readonly source: SourceRecord & { readonly config?: Readonly<Record<string, unknown>> };
  readonly limit?: number;
  readonly logger?: ConnectorLogger;
  readonly fetchImpl?: typeof fetch;
}

export interface RunOutcome {
  readonly sourceId: string;
  readonly connector: string;
  readonly ok: boolean;
  readonly ingestRunId?: string;
  readonly outcome?: PersistOutcome;
  readonly error?: string;
}

// Runs one connector pull against one source record. The runner is
// connector-agnostic; the registry resolves the implementation.

export async function runSource(opts: RunSourceOptions): Promise<RunOutcome> {
  const log = opts.logger ?? consoleLogger;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const { source, supabase } = opts;
  const found = lookupConnector(source.connector);
  if (!found) {
    return {
      sourceId: source.id,
      connector: source.connector,
      ok: false,
      error: `unknown connector: ${source.connector}`,
    };
  }
  const connector = found;

  const ingestRunId = await openIngestRun(supabase, source.tenantId, source.id, `${connector.name}@${connector.version}`);

  const ctx: ConnectorContext = {
    sourceId: source.id,
    tenantId: source.tenantId,
    ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
    now: () => new Date(),
    fetch: fetchImpl,
    logger: log,
  };

  const pullFn = connector.pull as (c: ConnectorContext, cfg?: unknown) => Promise<Awaited<ReturnType<typeof connector.pull>>>;
  try {
    const result = await pullFn(ctx, source.config);
    const outcome = await persist(
      { supabase, tenantId: source.tenantId, sourceId: source.id, ...(ingestRunId !== undefined ? { ingestRunId } : {}) },
      result,
    );
    if (ingestRunId) {
      await closeIngestRun(supabase, ingestRunId, outcome);
    }
    log.info('runner: complete', {
      connector: connector.name,
      pulled: outcome.pulled,
      inserted: outcome.inserted,
      duplicates: outcome.duplicates,
      errors: outcome.errors.length,
    });
    return {
      sourceId: source.id,
      connector: source.connector,
      ok: outcome.errors.length === 0,
      ...(ingestRunId !== undefined ? { ingestRunId } : {}),
      outcome,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log.error('runner: failed', { connector: connector.name, error: message });
    if (ingestRunId) {
      await closeIngestRun(supabase, ingestRunId, { pulled: 0, inserted: 0, duplicates: 0, errors: [message] }, message);
    }
    return {
      sourceId: source.id,
      connector: source.connector,
      ok: false,
      ...(ingestRunId !== undefined ? { ingestRunId } : {}),
      error: message,
    };
  }
}

// Convenience: pick all enabled sources for a tenant and run them.
// Returns one RunOutcome per source.
export async function runEnabledSources(
  supabase: SupabaseClient,
  tenantId: string,
  options?: { readonly limit?: number; readonly logger?: ConnectorLogger; readonly fetchImpl?: typeof fetch },
): Promise<readonly RunOutcome[]> {
  const { data, error } = await supabase
    .from('intel_sources')
    .select('id, tenant_id, family, connector, display_name, config, auth_ref, enabled, rate_limit_policy, freshness_sla_minutes, last_run_at, last_status')
    .eq('tenant_id', tenantId)
    .eq('enabled', true);
  if (error) throw new Error(`runEnabledSources: ${error.message}`);

  const outcomes: RunOutcome[] = [];
  for (const row of data ?? []) {
    const source: RunSourceOptions['source'] = {
      id: row.id,
      tenantId: row.tenant_id,
      family: row.family,
      connector: row.connector,
      displayName: row.display_name,
      config: row.config ?? {},
      authRef: row.auth_ref ?? undefined,
      enabled: row.enabled,
      rateLimitPolicy: row.rate_limit_policy ?? {},
      freshnessSlaMinutes: row.freshness_sla_minutes,
      lastRunAt: row.last_run_at ?? undefined,
      lastStatus: row.last_status ?? undefined,
    };
    outcomes.push(await runSource({
      supabase,
      source,
      ...(options?.limit !== undefined ? { limit: options.limit } : {}),
      ...(options?.logger !== undefined ? { logger: options.logger } : {}),
      ...(options?.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
    }));
  }
  return outcomes;
}
