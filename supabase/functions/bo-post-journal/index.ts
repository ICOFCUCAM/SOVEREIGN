// SOVEREIGN Back Office · post journal entry.
// Validates double-entry math (functional debits = functional credits)
// and writes the header + lines atomically. Posting roles only.
//
// Body: {
//   entryDate: 'YYYY-MM-DD',
//   periodId?: uuid,
//   memo: string,
//   reference?: string,
//   lines: [
//     {
//       accountId: uuid,
//       debitAmount: number,
//       creditAmount: number,
//       currency: bo_currency,
//       fxRate: number,        // to functional currency
//       memo?: string
//     }, ...
//   ],
//   postImmediately?: boolean  // if true → status='posted', else 'draft'
// }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const POSTING_ROLES = new Set([
  'superadmin','controller','accountant','treasurer','payroll_officer','tax_officer',
]);

function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status, headers: { ...cors, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST')   return err(405, 'method not allowed');

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) return err(401, 'missing authorization');

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !serviceKey) return err(500, 'server not configured');
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const userRes = await admin.auth.getUser(jwt);
  if (userRes.error || !userRes.data.user) return err(401, 'invalid token');
  const callerId = userRes.data.user.id;

  const profile = await admin.from('bo_user_profiles').select('role, status').eq('user_id', callerId).maybeSingle();
  if (profile.error)                       return err(500, profile.error.message);
  if (!profile.data)                       return err(403, 'no back-office profile');
  if (profile.data.status !== 'active')    return err(403, 'profile suspended');
  if (!POSTING_ROLES.has(profile.data.role)) return err(403, 'role not authorized to post entries');

  let body: {
    entryDate?: string; periodId?: string; memo?: string; reference?: string;
    postImmediately?: boolean;
    lines?: Array<{
      accountId?: string; debitAmount?: number; creditAmount?: number;
      currency?: string; fxRate?: number; memo?: string;
    }>;
  };
  try { body = await req.json(); } catch { return err(400, 'invalid json'); }

  const entryDate = String(body.entryDate ?? '');
  const memo = String(body.memo ?? '').trim();
  const lines = Array.isArray(body.lines) ? body.lines : [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return err(400, 'entryDate must be YYYY-MM-DD');
  if (!memo) return err(400, 'memo required');
  if (lines.length < 2) return err(400, 'journal entry requires ≥ 2 lines');

  // Validate period (if supplied) is not locked.
  if (body.periodId) {
    const p = await admin.from('bo_periods').select('status').eq('id', body.periodId).maybeSingle();
    if (p.error) return err(500, p.error.message);
    if (!p.data) return err(400, 'unknown period');
    if (p.data.status === 'locked') return err(409, 'period is locked');
  }

  // Compute functional totals and validate balance.
  const enriched = lines.map((l, idx) => {
    const debit  = Number(l.debitAmount ?? 0);
    const credit = Number(l.creditAmount ?? 0);
    const fx     = Number(l.fxRate ?? 1);
    if (!l.accountId)                  throw new Error(`line ${idx + 1}: accountId required`);
    if (!l.currency)                   throw new Error(`line ${idx + 1}: currency required`);
    if (!(fx > 0))                      throw new Error(`line ${idx + 1}: fxRate must be > 0`);
    if ((debit > 0) === (credit > 0))   throw new Error(`line ${idx + 1}: exactly one of debit/credit must be > 0`);
    return {
      line_no:           idx + 1,
      account_id:        l.accountId,
      debit_amount:      debit,
      credit_amount:     credit,
      currency:          l.currency,
      fx_rate:           fx,
      functional_debit:  debit  * fx,
      functional_credit: credit * fx,
      memo:              l.memo ?? null,
    };
  });

  let totalDebit = 0, totalCredit = 0;
  for (const l of enriched) { totalDebit += l.functional_debit; totalCredit += l.functional_credit; }
  // Tolerance for floating-point — cents-level.
  if (Math.abs(totalDebit - totalCredit) > 0.005) {
    return err(400, `unbalanced: functional debit ${totalDebit.toFixed(2)} ≠ credit ${totalCredit.toFixed(2)}`);
  }

  // Insert entry.
  const status = body.postImmediately ? 'posted' : 'draft';
  const insEntry = await admin.from('bo_journal_entries').insert({
    entry_date: entryDate,
    period_id:  body.periodId ?? null,
    memo,
    reference:  body.reference ?? null,
    status,
    created_by: callerId,
    ...(status === 'posted' ? { posted_by: callerId, posted_at: new Date().toISOString() } : {}),
  }).select('id, entry_number').single();
  if (insEntry.error) return err(500, `entry insert failed: ${insEntry.error.message}`);

  const entryId = insEntry.data.id as string;
  const insLines = await admin.from('bo_journal_lines').insert(
    enriched.map((l) => ({ ...l, entry_id: entryId })),
  );
  if (insLines.error) {
    await admin.from('bo_journal_entries').delete().eq('id', entryId);
    return err(500, `lines insert failed: ${insLines.error.message}`);
  }

  return new Response(JSON.stringify({
    ok: true,
    entry: {
      id: entryId,
      entryNumber: insEntry.data.entry_number,
      status,
      totalDebit: Number(totalDebit.toFixed(4)),
      totalCredit: Number(totalCredit.toFixed(4)),
      lineCount: enriched.length,
    },
  }), { status: 201, headers: { ...cors, 'content-type': 'application/json' } });
});
