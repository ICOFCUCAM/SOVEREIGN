import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { OpenproviderClient, OpenproviderNotConfigured, OpenproviderError } from './openprovider.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH = 10;            // jobs per run
const BUCKET = 'openprovider';
const CAPACITY = 60;         // provider calls
const REFILL_PER_SEC = 1;    // refill rate (≈60/min)
const BACKOFF_BASE_SEC = 30;
const BACKOFF_MAX_SEC = 3600;

// ── Token-bucket rate limiter backed by dns_rate_limits ──
async function consumeToken(admin: SupabaseClient): Promise<boolean> {
  const now = Date.now();
  const { data: row } = await admin.from('dns_rate_limits').select('*').eq('bucket', BUCKET).maybeSingle();
  if (!row) {
    await admin.from('dns_rate_limits').insert({ bucket: BUCKET, tokens: CAPACITY - 1, capacity: CAPACITY, refill_per_sec: REFILL_PER_SEC });
    return true;
  }
  const elapsed = (now - new Date(row.updated_at).getTime()) / 1000;
  const tokens = Math.min(row.capacity, row.tokens + elapsed * row.refill_per_sec);
  if (tokens < 1) {
    await admin.from('dns_rate_limits').update({ tokens, updated_at: new Date(now).toISOString() }).eq('bucket', BUCKET);
    return false;
  }
  await admin.from('dns_rate_limits').update({ tokens: tokens - 1, updated_at: new Date(now).toISOString() }).eq('bucket', BUCKET);
  return true;
}

async function audit(admin: SupabaseClient, action: string, resourceId: string, status: string, changes: Record<string, unknown>) {
  await admin.from('audit_logs').insert({ actor_email: 'dns-worker', action: `dns.${action}`, resource_type: 'dns', resource_id: resourceId, changes: { status, ...changes } }).then(() => {});
}

// ── Per-action handlers ──
async function handle(admin: SupabaseClient, op: OpenproviderClient, job: Record<string, any>) {
  const p = job.payload || {};
  switch (job.action) {
    case 'nameserver.create': {
      const res: any = await op.createNameserver({ name: p.name, ip: p.ip, ip6: p.ip6 });
      const opId = res?.data?.id ?? res?.id ?? null;
      await admin.from('nameservers').update({ op_id: opId ? String(opId) : null, status: 'active', updated_at: new Date().toISOString() }).eq('id', p.ns_id);
      return { op_id: opId };
    }
    case 'nameserver.update': {
      await op.updateNameserver(String(p.op_id || p.name), { ip: p.ip, ip6: p.ip6 });
      await admin.from('nameservers').update({ ip: p.ip, ip6: p.ip6, status: 'active', updated_at: new Date().toISOString() }).eq('id', p.ns_id);
      return { ok: true };
    }
    case 'zone.create': {
      const res: any = await op.createZone({ name: p.name, type: p.type, records: p.records });
      const opId = res?.data?.id ?? res?.id ?? null;
      await admin.from('dns_zones').update({ op_id: opId ? String(opId) : null, status: 'active', updated_at: new Date().toISOString() }).eq('id', p.zone_id);
      if (Array.isArray(p.records) && p.records.length) {
        await admin.from('dns_records').insert(p.records.map((r: any) => ({ zone_id: p.zone_id, owner: job.owner, type: r.type, name: r.name ?? '', value: r.value, ttl: r.ttl ?? 3600, prio: r.prio ?? null })));
      }
      return { op_id: opId };
    }
    case 'records.modify': {
      await op.modifyRecords(p.name, { add: p.add, remove: p.remove, update: (p.update || []) });
      if (Array.isArray(p.add) && p.add.length) {
        await admin.from('dns_records').insert(p.add.map((r: any) => ({ zone_id: p.zone_id, owner: job.owner, type: r.type, name: r.name ?? '', value: r.value, ttl: r.ttl ?? 3600, prio: r.prio ?? null })));
      }
      for (const r of (p.remove || [])) {
        await admin.from('dns_records').delete().eq('zone_id', p.zone_id).eq('type', r.type).eq('name', r.name ?? '').eq('value', r.value);
      }
      await admin.from('dns_zones').update({ updated_at: new Date().toISOString() }).eq('id', p.zone_id);
      return { ok: true };
    }
    case 'zone.delete': {
      await op.deleteZone(p.name);
      await admin.from('dns_records').delete().eq('zone_id', p.zone_id);
      await admin.from('dns_zones').update({ status: 'deleted', updated_at: new Date().toISOString() }).eq('id', p.zone_id);
      return { ok: true };
    }
    default:
      throw new Error(`Unknown job action: ${job.action}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const op = new OpenproviderClient();

  if (!op.configured) {
    return new Response(JSON.stringify({ note: 'OPENPROVIDER credentials not configured; jobs left queued.' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  const nowIso = new Date().toISOString();
  // Claim a batch of due jobs.
  const { data: jobs } = await admin.from('dns_jobs')
    .select('*').eq('status', 'queued').lte('next_run_at', nowIso).order('next_run_at', { ascending: true }).limit(BATCH);

  if (!jobs || jobs.length === 0) return new Response(JSON.stringify({ processed: 0 }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

  let processed = 0, failed = 0, deferred = 0;

  for (const job of jobs) {
    // Rate-limit gate: defer if no provider token available.
    if (!(await consumeToken(admin))) {
      await admin.from('dns_jobs').update({ next_run_at: new Date(Date.now() + 5000).toISOString() }).eq('id', job.id);
      deferred++;
      continue;
    }
    // Lock the job.
    await admin.from('dns_jobs').update({ status: 'processing', locked_at: nowIso }).eq('id', job.id);
    try {
      const result = await handle(admin, op, job);
      await admin.from('dns_jobs').update({ status: 'done', result, error: null, updated_at: new Date().toISOString() }).eq('id', job.id);
      await audit(admin, job.action, job.id, 'done', { owner: job.owner });
      processed++;
    } catch (e) {
      const err = e as OpenproviderError | Error;
      const attempts = (job.attempts ?? 0) + 1;
      const retryable = err instanceof OpenproviderError ? err.retryable : true;
      const exhausted = attempts >= (job.max_attempts ?? 5) || !retryable;
      if (exhausted) {
        await admin.from('dns_jobs').update({ status: 'failed', attempts, error: err.message, updated_at: new Date().toISOString() }).eq('id', job.id);
        // surface failure on the underlying resource
        if (job.payload?.zone_id) await admin.from('dns_zones').update({ status: 'failed' }).eq('id', job.payload.zone_id);
        if (job.payload?.ns_id) await admin.from('nameservers').update({ status: 'failed' }).eq('id', job.payload.ns_id);
        await audit(admin, job.action, job.id, 'failed', { error: err.message });
        failed++;
      } else {
        const delay = Math.min(BACKOFF_MAX_SEC, BACKOFF_BASE_SEC * Math.pow(2, attempts - 1));
        await admin.from('dns_jobs').update({ status: 'queued', attempts, error: err.message, next_run_at: new Date(Date.now() + delay * 1000).toISOString(), updated_at: new Date().toISOString() }).eq('id', job.id);
        deferred++;
      }
    }
  }

  return new Response(JSON.stringify({ processed, failed, deferred }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
});
