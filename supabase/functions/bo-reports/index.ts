// SOVEREIGN Back Office · financial reports.
// Returns Trial Balance, Income Statement (P&L), Balance Sheet
// for a date range. All amounts in functional currency.
//
// Body: { report: 'trial_balance' | 'income_statement' | 'balance_sheet',
//         startDate?: 'YYYY-MM-DD',
//         endDate?:   'YYYY-MM-DD' }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status, headers: { ...cors, 'content-type': 'application/json' },
  });
}

interface LineRow {
  account_id: string;
  functional_debit: number;
  functional_credit: number;
  bo_journal_entries: { entry_date: string; status: string } | null;
}
interface AccountRow {
  id: string; code: string; name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  currency: string;
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

  const profile = await admin.from('bo_user_profiles').select('role, status').eq('user_id', userRes.data.user.id).maybeSingle();
  if (profile.error || !profile.data) return err(403, 'no back-office profile');
  if (profile.data.status !== 'active') return err(403, 'profile suspended');

  let body: { report?: string; startDate?: string; endDate?: string };
  try { body = await req.json(); } catch { return err(400, 'invalid json'); }
  const report    = String(body.report ?? '');
  const startDate = body.startDate ? String(body.startDate) : null;
  const endDate   = body.endDate   ? String(body.endDate)   : null;
  if (!['trial_balance','income_statement','balance_sheet'].includes(report)) {
    return err(400, 'report must be trial_balance | income_statement | balance_sheet');
  }

  // Pull all accounts + posted lines within the date range.
  const accounts = await admin.from('bo_accounts').select('id, code, name, account_type, currency').order('code');
  if (accounts.error) return err(500, accounts.error.message);
  const acctRows = (accounts.data ?? []) as AccountRow[];
  const acctById = new Map(acctRows.map((a) => [a.id, a]));

  let q = admin.from('bo_journal_lines')
    .select('account_id, functional_debit, functional_credit, bo_journal_entries!inner(entry_date, status)')
    .eq('bo_journal_entries.status', 'posted');
  if (startDate) q = q.gte('bo_journal_entries.entry_date', startDate);
  if (endDate)   q = q.lte('bo_journal_entries.entry_date', endDate);
  const lines = await q;
  if (lines.error) return err(500, lines.error.message);

  const totalsByAcct = new Map<string, { debit: number; credit: number }>();
  for (const l of (lines.data ?? []) as unknown as LineRow[]) {
    const t = totalsByAcct.get(l.account_id) ?? { debit: 0, credit: 0 };
    t.debit  += Number(l.functional_debit ?? 0);
    t.credit += Number(l.functional_credit ?? 0);
    totalsByAcct.set(l.account_id, t);
  }

  // Build account-level rows with debit/credit/balance.
  // Asset & expense → natural debit balance (debit - credit).
  // Liability, equity, revenue → natural credit balance (credit - debit).
  const enriched = acctRows.map((a) => {
    const t = totalsByAcct.get(a.id) ?? { debit: 0, credit: 0 };
    const naturalDr = a.account_type === 'asset' || a.account_type === 'expense';
    const balance = naturalDr ? t.debit - t.credit : t.credit - t.debit;
    return {
      accountId:   a.id,
      code:        a.code,
      name:        a.name,
      accountType: a.account_type,
      currency:    a.currency,
      totalDebit:  Number(t.debit.toFixed(4)),
      totalCredit: Number(t.credit.toFixed(4)),
      balance:     Number(balance.toFixed(4)),
    };
  });

  let summary;
  if (report === 'trial_balance') {
    const totalDebit  = enriched.reduce((s, r) => s + r.totalDebit,  0);
    const totalCredit = enriched.reduce((s, r) => s + r.totalCredit, 0);
    summary = {
      report: 'trial_balance',
      startDate, endDate,
      rows: enriched,
      totals: { debit: Number(totalDebit.toFixed(4)), credit: Number(totalCredit.toFixed(4)) },
      balanced: Math.abs(totalDebit - totalCredit) < 0.005,
    };
  } else if (report === 'income_statement') {
    const revenue = enriched.filter((r) => r.accountType === 'revenue');
    const expense = enriched.filter((r) => r.accountType === 'expense');
    const totalRevenue = revenue.reduce((s, r) => s + r.balance, 0);
    const totalExpense = expense.reduce((s, r) => s + r.balance, 0);
    summary = {
      report: 'income_statement',
      startDate, endDate,
      revenue, expense,
      totalRevenue: Number(totalRevenue.toFixed(4)),
      totalExpense: Number(totalExpense.toFixed(4)),
      netIncome:    Number((totalRevenue - totalExpense).toFixed(4)),
    };
  } else {
    // balance_sheet (as-of endDate)
    const assets      = enriched.filter((r) => r.accountType === 'asset');
    const liabilities = enriched.filter((r) => r.accountType === 'liability');
    const equity      = enriched.filter((r) => r.accountType === 'equity');
    // Net income flows into equity for as-of presentation.
    const revenue = enriched.filter((r) => r.accountType === 'revenue').reduce((s, r) => s + r.balance, 0);
    const expense = enriched.filter((r) => r.accountType === 'expense').reduce((s, r) => s + r.balance, 0);
    const retainedFromPeriod = revenue - expense;
    const totalAssets      = assets.reduce((s, r) => s + r.balance, 0);
    const totalLiabilities = liabilities.reduce((s, r) => s + r.balance, 0);
    const totalEquityBooked = equity.reduce((s, r) => s + r.balance, 0);
    const totalEquity = totalEquityBooked + retainedFromPeriod;
    summary = {
      report: 'balance_sheet',
      startDate, endDate,
      assets, liabilities, equity,
      retainedFromPeriod: Number(retainedFromPeriod.toFixed(4)),
      totalAssets:      Number(totalAssets.toFixed(4)),
      totalLiabilities: Number(totalLiabilities.toFixed(4)),
      totalEquity:      Number(totalEquity.toFixed(4)),
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.005,
    };
  }

  return new Response(JSON.stringify({ ok: true, summary }), {
    status: 200, headers: { ...cors, 'content-type': 'application/json' },
  });
});
