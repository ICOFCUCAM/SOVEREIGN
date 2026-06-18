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
