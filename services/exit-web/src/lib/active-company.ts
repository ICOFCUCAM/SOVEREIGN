import type { CompanyProfile } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile";
import { buildProfile, SAMPLE_INTAKE, type IntakeInputs } from "./company-intake";
import { sectorTokensFor } from "./buyer-dna";

// ── ACTIVE COMPANY ──────────────────────────────────────────────────
// The company the console personalizes to. If the founder has run the
// intake (Value My Company), that profile is the active one; otherwise the
// demo company. This is what turns the platform from a one-company demo
// into a tool for any founder.

const KEY = "exitos.intake.v1";

export function loadActiveCompany(): { company: CompanyProfile; fromIntake: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const inputs = { ...SAMPLE_INTAKE, ...(JSON.parse(raw) as Partial<IntakeInputs>) };
      return { company: buildProfile(inputs), fromIntake: true };
    }
  } catch { /* fall through to demo */ }
  return { company: SAMPLE_COMPANY, fromIntake: false };
}

/** Sector vocabulary for the active company — drives buyer-overlap ranking. */
export const activeTokens = (company: CompanyProfile): readonly string[] => sectorTokensFor(company.sector);

// ── Saved intake ────────────────────────────────────────────────────
// The founder's figures are saved only when they enter them — never just
// because a page was opened — so "Your intake" always means the founder's
// own data. Clearing returns every page to the demo company.

/** The founder's saved figures, or null when none are saved. */
export function loadSavedIntake(): IntakeInputs | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...SAMPLE_INTAKE, ...(JSON.parse(raw) as Partial<IntakeInputs>) } : null;
  } catch { return null; }
}

export function saveIntake(inputs: IntakeInputs): void {
  try { localStorage.setItem(KEY, JSON.stringify(inputs)); } catch { /* storage unavailable: nothing saved */ }
}

export function clearIntake(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
