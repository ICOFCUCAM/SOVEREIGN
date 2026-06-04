// SOVEREIGN Back Office · client.
//
// Typed wrappers around the bo_* tables (Supabase) and the three edge
// functions (bo-create-user / bo-post-journal / bo-reports). Auth is
// the shared supabase client; the user's role is read from
// bo_user_profiles. RLS enforces all reads/writes at the database.

import { supabase } from "./supabase";

export type BoRole =
  | "superadmin" | "admin" | "accountant" | "auditor"
  | "treasurer" | "controller" | "payroll_officer" | "tax_officer";

export type BoAccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export type BoCurrency =
  | "USD" | "GBP" | "EUR" | "NOK" | "SEK" | "DKK" | "CHF" | "CAD"
  | "AUD" | "JPY" | "BRL" | "INR" | "MXN" | "SGD" | "AED";

export const BO_CURRENCIES: BoCurrency[] = [
  "USD","GBP","EUR","NOK","SEK","DKK","CHF","CAD","AUD","JPY","BRL","INR","MXN","SGD","AED",
];

export const BO_ROLES: { value: BoRole; label: string; description: string }[] = [
  { value: "superadmin",      label: "Superadmin",       description: "Full system access; creates other officers." },
  { value: "admin",           label: "Admin",            description: "Operational settings; no posting authority." },
  { value: "accountant",      label: "Accountant",       description: "Posts journal entries, maintains the chart of accounts." },
  { value: "auditor",         label: "Auditor",          description: "Read-only across all data plus full audit log." },
  { value: "treasurer",       label: "Treasurer",        description: "Bank reconciliation, payment authorization." },
  { value: "controller",      label: "Controller",       description: "Period close, journal review, financial reports." },
  { value: "payroll_officer", label: "Payroll officer",  description: "Payroll entries only." },
  { value: "tax_officer",     label: "Tax officer",      description: "Tax provisions and statutory reports." },
];

export interface BoProfile {
  user_id: string;
  role: BoRole;
  full_name: string;
  employee_id: string | null;
  status: "active" | "suspended" | "revoked";
  last_login_at: string | null;
  created_at: string;
}

export interface BoAccount {
  id: string;
  code: string;
  name: string;
  account_type: BoAccountType;
  parent_id: string | null;
  currency: BoCurrency;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

export interface BoPeriod {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: "open" | "closed" | "locked";
}

export interface BoJournalEntry {
  id: string;
  entry_number: number;
  entry_date: string;
  period_id: string | null;
  memo: string;
  reference: string | null;
  status: "draft" | "posted" | "voided";
  created_by: string;
  posted_by: string | null;
  posted_at: string | null;
  created_at: string;
}

export interface BoJournalLine {
  id: string;
  entry_id: string;
  line_no: number;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  currency: BoCurrency;
  fx_rate: number;
  functional_debit: number;
  functional_credit: number;
  memo: string | null;
}

export interface BoAuditEntry {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: BoRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  at: string;
}

const FN_URL = (path: string): string => {
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
    ?? "https://qvjdivcdefuprnenedje.supabase.co";
  return `${base}/functions/v1/${path}`;
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) throw new Error("not signed in");
  return {
    "Authorization": `Bearer ${jwt}`,
    "content-type": "application/json",
  };
}

// ── Profile + permissions ────────────────────────────────────────
export async function fetchMyBoProfile(userId: string): Promise<BoProfile | null> {
  const { data, error } = await supabase
    .from("bo_user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BoProfile | null) ?? null;
}

export async function listBoUsers(): Promise<BoProfile[]> {
  const { data, error } = await supabase
    .from("bo_user_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BoProfile[];
}

export async function updateBoUserStatus(userId: string, status: BoProfile["status"]): Promise<void> {
  const { error } = await supabase
    .from("bo_user_profiles")
    .update({ status })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

// ── Create user (superadmin only, via edge function) ─────────────
export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: BoRole;
  employeeId?: string;
}
export async function createBoUser(input: CreateUserInput): Promise<{ id: string }> {
  const res = await fetch(FN_URL("bo-create-user"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error ?? `create failed: ${res.status}`);
  return { id: json.user.id };
}

// ── Accounts ─────────────────────────────────────────────────────
export async function listAccounts(): Promise<BoAccount[]> {
  const { data, error } = await supabase.from("bo_accounts").select("*").order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as BoAccount[];
}
export async function createAccount(a: Omit<BoAccount, "id" | "created_at">): Promise<void> {
  const { error } = await supabase.from("bo_accounts").insert(a);
  if (error) throw new Error(error.message);
}
export async function setAccountActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase.from("bo_accounts").update({ is_active }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Periods ──────────────────────────────────────────────────────
export async function listPeriods(): Promise<BoPeriod[]> {
  const { data, error } = await supabase.from("bo_periods").select("*").order("starts_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BoPeriod[];
}

// ── Journal entries ─────────────────────────────────────────────
export async function listEntries(limit = 50): Promise<BoJournalEntry[]> {
  const { data, error } = await supabase
    .from("bo_journal_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as BoJournalEntry[];
}

export async function fetchEntryLines(entryId: string): Promise<BoJournalLine[]> {
  const { data, error } = await supabase
    .from("bo_journal_lines")
    .select("*")
    .eq("entry_id", entryId)
    .order("line_no");
  if (error) throw new Error(error.message);
  return (data ?? []) as BoJournalLine[];
}

export interface PostJournalInput {
  entryDate: string;
  periodId?: string;
  memo: string;
  reference?: string;
  postImmediately?: boolean;
  lines: Array<{
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    currency: BoCurrency;
    fxRate: number;
    memo?: string;
  }>;
}
export interface PostJournalResult {
  id: string; entryNumber: number; status: "draft" | "posted";
  totalDebit: number; totalCredit: number; lineCount: number;
}
export async function postJournalEntry(input: PostJournalInput): Promise<PostJournalResult> {
  const res = await fetch(FN_URL("bo-post-journal"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error ?? `post failed: ${res.status}`);
  return json.entry;
}

// ── Reports ──────────────────────────────────────────────────────
export type ReportKind = "trial_balance" | "income_statement" | "balance_sheet";

export interface TrialBalanceReport {
  report: "trial_balance";
  startDate: string | null;
  endDate: string | null;
  rows: Array<{
    accountId: string; code: string; name: string; accountType: BoAccountType;
    currency: BoCurrency; totalDebit: number; totalCredit: number; balance: number;
  }>;
  totals: { debit: number; credit: number };
  balanced: boolean;
}

export interface IncomeStatementReport {
  report: "income_statement";
  startDate: string | null;
  endDate: string | null;
  revenue: TrialBalanceReport["rows"];
  expense: TrialBalanceReport["rows"];
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
}

export interface BalanceSheetReport {
  report: "balance_sheet";
  startDate: string | null;
  endDate: string | null;
  assets: TrialBalanceReport["rows"];
  liabilities: TrialBalanceReport["rows"];
  equity: TrialBalanceReport["rows"];
  retainedFromPeriod: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  balanced: boolean;
}

export type ReportSummary = TrialBalanceReport | IncomeStatementReport | BalanceSheetReport;

export async function fetchReport(report: ReportKind, startDate?: string, endDate?: string): Promise<ReportSummary> {
  const res = await fetch(FN_URL("bo-reports"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ report, startDate, endDate }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error ?? `report failed: ${res.status}`);
  return json.summary;
}

// ── Audit log ────────────────────────────────────────────────────
export async function listAuditLog(limit = 200): Promise<BoAuditEntry[]> {
  const { data, error } = await supabase
    .from("bo_audit_log")
    .select("*")
    .order("at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as BoAuditEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────
export function canPost(role: BoRole | undefined): boolean {
  return role === "superadmin" || role === "controller" || role === "accountant"
    || role === "treasurer" || role === "payroll_officer" || role === "tax_officer";
}
export function canManageAccounts(role: BoRole | undefined): boolean {
  return role === "superadmin" || role === "controller" || role === "accountant";
}
export function canManageUsers(role: BoRole | undefined): boolean {
  return role === "superadmin";
}
export function canSeeAudit(role: BoRole | undefined): boolean {
  return role === "superadmin" || role === "auditor";
}

export function fmtMoney(n: number, currency: string = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}
