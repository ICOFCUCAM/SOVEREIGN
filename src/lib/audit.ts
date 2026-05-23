import { supabase } from '@/lib/supabase';

export type AuditAction = 'domain.create' | 'domain.update' | 'domain.delete' | 'lead.update' | 'role.update';

export interface AuditLogEntry {
  id: string;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  changes: any;
  created_at: string;
}

export async function logAudit(opts: {
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  actor_email?: string | null;
  changes?: Record<string, any>;
}) {
  try {
    await supabase.from('audit_logs').insert({
      actor_email: opts.actor_email ?? null,
      action: opts.action,
      resource_type: opts.resource_type,
      resource_id: opts.resource_id,
      changes: opts.changes ?? {},
    });
  } catch (e) {
    console.error('audit log failed', e);
  }
}

export async function fetchRecentAuditLogs(limit = 20): Promise<AuditLogEntry[]> {
  const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  return (data || []) as AuditLogEntry[];
}
