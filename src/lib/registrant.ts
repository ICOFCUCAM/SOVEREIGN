import { supabase } from '@/lib/supabase';

// ── Registrant profiles ───────────────────────────────────────────────
// Reusable registrant identities for domain registration (regulated PII).
// Owner-scoped via RLS. The Openprovider customer handle (op_handle) is
// populated server-side when the profile is first used to register.

export interface RegistrantProfile {
  id: string;
  owner: string;
  label: string | null;
  company_name: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string | null;
  zipcode: string;
  country: string;
  op_handle: string | null;
  created_at: string;
  updated_at: string;
}

export type RegistrantInput = Omit<RegistrantProfile, 'id' | 'owner' | 'op_handle' | 'created_at' | 'updated_at'>;

export async function listRegistrants(): Promise<RegistrantProfile[]> {
  const { data, error } = await supabase
    .from('registrant_profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistrantProfile[];
}

export async function createRegistrant(input: RegistrantInput): Promise<RegistrantProfile> {
  const { data, error } = await supabase.from('registrant_profiles').insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as RegistrantProfile;
}

export async function updateRegistrant(id: string, patch: Partial<RegistrantInput>): Promise<void> {
  const { error } = await supabase
    .from('registrant_profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteRegistrant(id: string): Promise<void> {
  const { error } = await supabase.from('registrant_profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
