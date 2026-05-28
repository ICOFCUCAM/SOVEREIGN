import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/lib/invoke';

// ── Domain orders ─────────────────────────────────────────────────────
// Two coordinated purchase paths:
//   • stripe   — self-service Checkout (auth-hold → capture on register success)
//   • invoice  — institutional request; admin reviews, invoices, marks paid,
//                approves & registers from the admin orders panel
// 'manual' reserved for back-office, no-payment registrations.

export type PaymentMethod = 'stripe' | 'invoice' | 'manual';
export type OrderStatus =
  | 'draft' | 'requested' | 'quoted' | 'invoiced' | 'paid'
  | 'awaiting_payment' | 'payment_authorized'
  | 'registering' | 'registered' | 'failed' | 'voided' | 'refunded';

export interface DomainOrder {
  id: string;
  owner: string;
  domain: string;
  tld: string;
  years: number;
  registrant_profile_id: string | null;
  deployment_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  cost_amount: number | null;
  retail_amount: number | null;
  currency: string | null;
  markup_bps: number | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  op_order_id: string | null;
  op_domain_id: string | null;
  contact_email: string | null;
  company_name: string | null;
  notes: string | null;
  invoice_number: string | null;
  approved_by: string | null;
  approved_at: string | null;
  captured_at: string | null;
  registered_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckoutInput {
  domain: string;
  years?: number;
  registrant_profile_id: string;
  payment_method: PaymentMethod;
  contact_email?: string;
  company_name?: string;
  notes?: string;
}

// Owner-scoped list for the customer's own console.
export async function listMyOrders(): Promise<DomainOrder[]> {
  const { data, error } = await supabase
    .from('domain_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DomainOrder[];
}

// Admin-only list (RLS surfaces all orders when is_admin()).
export async function listAllOrders(): Promise<DomainOrder[]> {
  return listMyOrders();
}

// Stripe path → returns a Checkout URL to redirect the customer to.
// Invoice path → creates a pending order and returns it; admin handles the rest.
export async function startCheckout(input: CheckoutInput): Promise<{ order: DomainOrder; checkout_url?: string }> {
  return invokeFunction('domain-checkout', input as unknown as Record<string, unknown>);
}

// Admin actions over the lifecycle.
export async function updateOrder(id: string, patch: Partial<Pick<DomainOrder, 'status' | 'notes' | 'invoice_number' | 'retail_amount' | 'currency'>>): Promise<void> {
  const { error } = await supabase.from('domain_orders').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

// Approve & register — fires the OP create call (and captures the PaymentIntent
// on the Stripe path). Idempotent on the order's idempotency key.
export async function approveAndRegister(orderId: string): Promise<{ ok: boolean; order: DomainOrder }> {
  return invokeFunction('domain-register', { order_id: orderId });
}
