import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/lib/invoke';

// ── DNS service client ────────────────────────────────────────────────
// Reads are owner-scoped table selects (enforced by RLS). Mutations route
// through the dns-service edge function, which validates ownership, writes a
// pending row, and enqueues an async job processed by the dns-worker.

export interface Nameserver { id: string; name: string; ip: string | null; ip6: string | null; op_id: string | null; status: string; created_at: string }
export interface DnsZone { id: string; name: string; type: string; provider: string; op_id: string | null; dnssec: boolean; status: string; created_at: string }
export interface DnsRecordRow { id: string; zone_id: string; type: string; name: string; value: string; ttl: number; prio: number | null; status: string }
export interface DnsJob { id: string; action: string; status: string; attempts: number; error: string | null; created_at: string; updated_at: string }
export interface RecordInput { type: string; name?: string; value: string; ttl?: number; prio?: number }

const call = <T>(body: Record<string, unknown>): Promise<T> => invokeFunction<T>('dns-service', body);

// ── Reads (RLS owner-scoped) ──
export async function listNameservers(): Promise<Nameserver[]> {
  const { data } = await supabase.from('nameservers').select('*').order('created_at', { ascending: false });
  return (data || []) as Nameserver[];
}
export async function listZones(): Promise<DnsZone[]> {
  const { data } = await supabase.from('dns_zones').select('*').order('created_at', { ascending: false });
  return (data || []) as DnsZone[];
}
export async function listRecords(zoneId: string): Promise<DnsRecordRow[]> {
  const { data } = await supabase.from('dns_records').select('*').eq('zone_id', zoneId);
  return (data || []) as DnsRecordRow[];
}
export async function listDnsJobs(): Promise<DnsJob[]> {
  const { data } = await supabase.from('dns_jobs').select('id, action, status, attempts, error, created_at, updated_at').order('created_at', { ascending: false }).limit(50);
  return (data || []) as DnsJob[];
}

// ── Mutations (enqueued via dns-service) ──
export const createNameserver = (input: { name: string; ip?: string; ip6?: string }) =>
  call<{ nameserver_id: string; job_id: string }>({ action: 'create-nameserver', ...input });

export const updateNameservers = (input: { id: string; ip?: string; ip6?: string }) =>
  call<{ nameserver_id: string; job_id: string }>({ action: 'update-nameservers', ...input });

export const createZone = (input: { name: string; type?: string; records?: RecordInput[] }) =>
  call<{ zone_id: string; job_id: string }>({ action: 'create-zone', ...input });

export const modifyRecords = (input: { zone_id: string; add?: RecordInput[]; remove?: RecordInput[]; update?: Array<{ original: RecordInput; record: RecordInput }> }) =>
  call<{ zone_id: string; job_id: string }>({ action: 'modify-records', ...input });

export const deleteZone = (zone_id: string) =>
  call<{ zone_id: string; job_id: string }>({ action: 'delete-zone', zone_id });
