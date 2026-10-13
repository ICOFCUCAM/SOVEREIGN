import type { CompanyProfile } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile";
import { buildProfile, SAMPLE_INTAKE, type IntakeInputs } from "./company-intake";
import { sectorTokensFor } from "./buyer-dna";

// ── ACTIVE COMPANY ──────────────────────────────────────────────────
// The company the console personalizes to. If the founder has run the
// intake (Value My Company), that profile is the active one; otherwise the
// demo company.
//
// The intake form starts from the demo company's figures, so a saved intake
// records WHICH fields the founder actually entered or confirmed. Every other
// field still holds a demo value and is reported as unconfirmed — documents
// must treat those as missing, never as the founder's data. Each saved
// company also gets its own stable id, so generated documents can be traced
// to it.

const KEY = "exitos.intake.v2";
const LEGACY_KEY = "exitos.intake.v1";

export type IntakeField = keyof IntakeInputs;
export const INTAKE_FIELDS = Object.keys(SAMPLE_INTAKE) as IntakeField[];

/** A saved intake: the company's id, its inputs, and the fields the founder supplied. */
export interface IntakeRecord {
  readonly id: string;
  readonly inputs: IntakeInputs;
  readonly provided: readonly IntakeField[];
}

const newCompanyId = (): string =>
  `co-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`}`;

const store = (r: IntakeRecord): void => {
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* storage unavailable: nothing saved */ }
};

/** The saved intake record, or null. An intake saved by an earlier version (which
 *  stored the whole form) is migrated: a field counts as supplied only where it
 *  differs from the demo company's value. */
export function loadIntakeRecord(): IntakeRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const r = JSON.parse(raw) as IntakeRecord;
      const provided = r.provided.filter((k) => INTAKE_FIELDS.includes(k));
      return { id: r.id, inputs: { ...SAMPLE_INTAKE, ...r.inputs }, provided };
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as Partial<IntakeInputs>;
      const provided = INTAKE_FIELDS.filter((k) => k in old && old[k] !== SAMPLE_INTAKE[k]);
      const rec: IntakeRecord = { id: newCompanyId(), inputs: { ...SAMPLE_INTAKE, ...old }, provided };
      store(rec);
      try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
      return rec;
    }
  } catch { /* unreadable: treat as none */ }
  return null;
}

/** The fields of a saved intake that still hold the demo company's values. */
export const unconfirmedFields = (r: IntakeRecord): IntakeField[] => INTAKE_FIELDS.filter((k) => !r.provided.includes(k));

export function loadActiveCompany(): { company: CompanyProfile; fromIntake: boolean; companyId: string | null; unconfirmed: IntakeField[] } {
  const r = loadIntakeRecord();
  if (r) return { company: { ...buildProfile(r.inputs), id: r.id }, fromIntake: true, companyId: r.id, unconfirmed: unconfirmedFields(r) };
  return { company: SAMPLE_COMPANY, fromIntake: false, companyId: null, unconfirmed: [] };
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

export function clearIntake(): void {
  try { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
}
