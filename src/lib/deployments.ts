import { supabase } from '@/lib/supabase';

// ── Sovereign deployment records ──────────────────────────────────────
// Persisted, owner-scoped deployment blueprints — the primitive that turns an
// orchestration session into a resumable deployment. No provisioning or
// registration is triggered here; status stays 'draft' until activation.

export type DomainStrategy = 'existing' | 'register' | 'recommend' | 'skip';
export type DeploymentStatus = 'draft' | 'provisioning' | 'live' | 'archived';

export interface Deployment {
  id: string;
  owner: string;
  name: string | null;
  deployment_type: string;
  domain_strategy: DomainStrategy;
  domain: string | null;
  subdomain: string | null;
  status: DeploymentStatus;
  lifecycle: string[];
  blueprint: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DeploymentInput {
  name?: string | null;
  deployment_type: string;
  domain_strategy: DomainStrategy;
  domain?: string | null;
  subdomain?: string | null;
  lifecycle: string[];
  blueprint?: Record<string, unknown>;
}

export async function listDeployments(): Promise<Deployment[]> {
  const { data, error } = await supabase
    .from('deployments')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Deployment[];
}

export async function createDeployment(input: DeploymentInput): Promise<Deployment> {
  const { data, error } = await supabase
    .from('deployments')
    .insert({
      name: input.name ?? null,
      deployment_type: input.deployment_type,
      domain_strategy: input.domain_strategy,
      domain: input.domain ?? null,
      subdomain: input.subdomain ?? null,
      lifecycle: input.lifecycle,
      blueprint: input.blueprint ?? {},
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Deployment;
}

export async function updateDeployment(id: string, patch: Partial<DeploymentInput> & { status?: DeploymentStatus }): Promise<void> {
  const { error } = await supabase
    .from('deployments')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function archiveDeployment(id: string): Promise<void> {
  await updateDeployment(id, { status: 'archived' });
}
