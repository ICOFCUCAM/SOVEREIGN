import { invokeFunction } from '@/lib/invoke';
import { supabase } from '@/lib/supabase';

// ── Domain connections ────────────────────────────────────────────────
// Prove control of an externally-registered domain via a DNS TXT challenge,
// then operate its DNS on sovereign infrastructure. Owner-scoped via RLS.

export interface DomainConnection {
  id: string;
  owner: string;
  domain: string;
  token: string;
  verified: boolean;
  verified_at: string | null;
  status: 'pending' | 'verified' | 'provisioning' | 'connected' | 'failed';
  zone_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeRecord { type: string; host: string; name: string; value: string }

export async function listConnections(): Promise<DomainConnection[]> {
  const { data, error } = await supabase.from('domain_connections').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DomainConnection[];
}

export async function initConnection(domain: string): Promise<{ connection: DomainConnection; record: ChallengeRecord }> {
  return invokeFunction('connect-domain', { action: 'init', domain });
}

export async function verifyConnection(connectionId: string): Promise<{ verified: boolean; found: string[] }> {
  return invokeFunction('connect-domain', { action: 'verify', connection_id: connectionId });
}

// The authoritative nameservers a connected domain must be delegated to.
export async function getSovereignNameservers(): Promise<string[]> {
  const { nameservers } = await invokeFunction<{ nameservers: string[] }>('connect-domain', { action: 'nameservers' });
  return nameservers;
}

export async function deleteConnection(id: string): Promise<void> {
  const { error } = await supabase.from('domain_connections').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Link a provisioned DNS zone to a verified connection.
export async function attachConnectionZone(id: string, zoneId: string): Promise<void> {
  const { error } = await supabase
    .from('domain_connections')
    .update({ zone_id: zoneId, status: 'provisioning', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
