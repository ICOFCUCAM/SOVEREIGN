import type { CompanyProfile } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile";
import { buildProfile, SAMPLE_INTAKE, type IntakeInputs } from "./company-intake";
import { sectorTokensFor } from "./buyer-dna";

// ── ACTIVE COMPANY ──────────────────────────────────────────────────
// The company the console personalizes to: the founder's selected company
// (a founder may have several; see "The founder's companies" below), or the
// demo company when none is selected.
//
// The intake form starts from the demo company's figures, so a saved intake
// records WHICH fields the founder actually entered or confirmed. Every other
// field still holds a demo value and is reported as unconfirmed — documents
// must treat those as missing, never as the founder's data. Each saved
// company also gets its own stable id, so generated documents can be traced
// to it.

const KEY = "exitos.intake.v2";
const LEGACY_KEY = "exitos.intake.v1";

import { EMPTY_STORY, type CompanyStory } from "@exit/engines";
import { loadStory, profileWithStory } from "./company-story";

export type IntakeField = keyof IntakeInputs;
export const INTAKE_FIELDS = Object.keys(SAMPLE_INTAKE) as IntakeField[];

/** A saved intake: the company's id, its inputs, and the fields the founder supplied. */
export interface IntakeRecord {
  readonly id: string;
  readonly inputs: IntakeInputs;
  readonly provided: readonly IntakeField[];
  /** when it was last saved (this browser's clock, or the server's for a copy from the account) */
  readonly updatedAt?: string;
}

const newCompanyId = (): string =>
  `co-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`}`;

// ── The founder's companies ─────────────────────────────────────────
// A founder may prepare and list several companies or products. Each is one saved intake with its own
// id; one is selected at a time and every page works on it. The first company (or the one migrated from
// the single-company store) keeps the browser's unscoped keys, so nothing saved before moves.
const COMPANIES_KEY = "exitos.companies.v1";
const EVENT = "exitos:company";
interface Companies { active: string | null; primary: string | null; records: IntakeRecord[]; synced?: string[] }

const clean = (r: IntakeRecord): IntakeRecord => ({ id: r.id, inputs: { ...SAMPLE_INTAKE, ...r.inputs }, provided: (r.provided ?? []).filter((k) => INTAKE_FIELDS.includes(k)), ...(r.updatedAt ? { updatedAt: r.updatedAt } : {}) });

function readCompanies(): Companies {
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (raw) {
      const c = JSON.parse(raw) as Companies;
      const records = Array.isArray(c.records) ? c.records.map(clean) : [];
      const active = records.some((r) => r.id === c.active) ? c.active : null;
      return { active, primary: c.primary ?? records[0]?.id ?? null, records, synced: Array.isArray(c.synced) ? c.synced : [] };
    }
    // the single-company store of earlier versions becomes the first company
    const single = localStorage.getItem(KEY);
    if (single) {
      const r = clean(JSON.parse(single) as IntakeRecord);
      const c: Companies = { active: r.id, primary: r.id, records: [r] };
      writeCompanies(c, false); try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      return c;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as Partial<IntakeInputs>;
      const provided = INTAKE_FIELDS.filter((k) => k in old && old[k] !== SAMPLE_INTAKE[k]);
      const r: IntakeRecord = { id: newCompanyId(), inputs: { ...SAMPLE_INTAKE, ...old }, provided };
      const c: Companies = { active: r.id, primary: r.id, records: [r] };
      writeCompanies(c, false); try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
      return c;
    }
  } catch { /* unreadable: treat as none */ }
  return { active: null, primary: null, records: [] };
}

function writeCompanies(c: Companies, notify = true): void {
  try { localStorage.setItem(COMPANIES_KEY, JSON.stringify(c)); } catch { /* storage unavailable: nothing saved */ }
  if (notify) { try { window.dispatchEvent(new Event(EVENT)); } catch { /* no window (tests) */ } }
}

// where saved companies also go: the founder's account, when signed in (set by useCompanySync)
interface CompanySink { save(r: IntakeRecord): void; remove(id: string): void }
let sink: CompanySink | null = null;
export function setCompanySink(s: CompanySink | null): void { sink = s; }

const store = (rec: IntakeRecord): void => {
  const r: IntakeRecord = { ...rec, updatedAt: new Date().toISOString() };
  const c = readCompanies();
  const records = c.records.some((x) => x.id === r.id) ? c.records.map((x) => (x.id === r.id ? r : x)) : [...c.records, r];
  writeCompanies({ ...c, active: r.id, primary: c.primary ?? r.id, records });
  sink?.save(r);
};

/** This browser's companies and which of them the account has had (for the merge in lib/company-sync). */
export function localCompanies(): { records: IntakeRecord[]; synced: string[] } {
  const c = readCompanies();
  return { records: c.records, synced: c.synced ?? [] };
}
/** Replace this browser's companies with the merged list; the selection stays if that company remains. */
export function replaceCompanies(records: IntakeRecord[], synced: string[]): void {
  const c = readCompanies();
  const clean_ = records.map(clean);
  const active = clean_.some((r) => r.id === c.active) ? c.active : null;
  writeCompanies({ active, primary: c.primary ?? clean_[0]?.id ?? null, records: clean_, synced });
}

/** The selected company's saved intake record, or null (no company selected: the demo company). */
export function loadIntakeRecord(): IntakeRecord | null {
  const c = readCompanies();
  return c.records.find((r) => r.id === c.active) ?? null;
}

export interface CompanySummary { readonly id: string; readonly name: string; readonly active: boolean }
/** The founder's companies, in the order they were added. */
export function listCompanies(): CompanySummary[] {
  const c = readCompanies();
  return c.records.map((r) => ({ id: r.id, name: r.inputs.name?.trim() || "Untitled company", active: r.id === c.active }));
}
/** Each saved company's profile (for listing status and the like), without its story. */
export function companyProfiles(): Array<{ id: string; profile: CompanyProfile }> {
  return readCompanies().records.map((r) => ({ id: r.id, profile: { ...buildProfile(r.inputs), id: r.id } }));
}
/** Work on another of the founder's companies; null starts a new one (the demo company until saved). */
export function selectCompany(id: string | null): void {
  const c = readCompanies();
  if (id !== null && !c.records.some((r) => r.id === id)) return;
  writeCompanies({ ...c, active: id });
}
/** Re-render when the selected company or the list changes (in this tab). */
export function onCompanyChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
/** The browser key for a per-company store: the first company keeps the unscoped key, others get their own. */
export function companyScopedKey(base: string): string {
  const c = readCompanies();
  return !c.active || c.active === c.primary ? base : `${base}@${c.active}`;
}

/** The fields of a saved intake that still hold the demo company's values. */
export const unconfirmedFields = (r: IntakeRecord): IntakeField[] => INTAKE_FIELDS.filter((k) => !r.provided.includes(k));

/** The one company context every page and generator uses: the founder's intake with
 *  what their company story supplies (headcount, cap table, sourced market size …),
 *  the story itself, and the profile fields that are still assumed for the engines. */
export function loadActiveCompany(): { company: CompanyProfile; fromIntake: boolean; companyId: string | null; unconfirmed: IntakeField[]; story: CompanyStory; assumed: readonly string[] } {
  const r = loadIntakeRecord();
  if (r) {
    const story = loadStory(r.id);
    const { profile, assumed } = profileWithStory({ ...buildProfile(r.inputs), id: r.id }, story);
    return { company: profile, fromIntake: true, companyId: r.id, unconfirmed: unconfirmedFields(r), story, assumed };
  }
  return { company: SAMPLE_COMPANY, fromIntake: false, companyId: null, unconfirmed: [], story: EMPTY_STORY, assumed: [] };
}

/** Sector vocabulary for the active company — drives buyer-overlap ranking. */
export const activeTokens = (company: CompanyProfile): readonly string[] => sectorTokensFor(company.sector);

// ── Saved intake ────────────────────────────────────────────────────
// The founder's figures are saved only when they enter them — never just
// because a page was opened — so "Your intake" always means the founder's
// own data. Clearing returns every page to the demo company.

/** The founder's saved figures, or null when none are saved. */
export function loadSavedIntake(): IntakeInputs | null {
  return loadIntakeRecord()?.inputs ?? null;
}

/** Save the form; `supplied` are the fields the founder has just entered or confirmed. */
export function saveIntake(inputs: IntakeInputs, supplied: readonly IntakeField[] = []): void {
  const cur = loadIntakeRecord();
  const provided = [...new Set([...(cur?.provided ?? []), ...supplied])];
  store({ id: cur?.id ?? newCompanyId(), inputs, provided });
}

/** Mark fields as the founder's own, keeping their current values. */
export function confirmIntakeFields(fields: readonly IntakeField[]): void {
  const cur = loadIntakeRecord();
  if (cur) store({ ...cur, provided: [...new Set([...cur.provided, ...fields])] });
}

/** Remove the selected company from this browser; no company is then selected (the demo company). */
export function clearIntake(): void {
  const c = readCompanies();
  const records = c.records.filter((r) => r.id !== c.active);
  // the removed company's key slot is not handed on: another company never inherits its drafts
  writeCompanies({ ...c, active: null, primary: c.primary, records, synced: (c.synced ?? []).filter((id) => id !== c.active) });
  if (c.active) sink?.remove(c.active);
  try { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
}
