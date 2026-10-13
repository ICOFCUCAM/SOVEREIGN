import { runInstitutionalValuation, runReadiness, runBuyerDiscovery, runDueDiligence, DEFAULT_PROCESS_TIMELINE, type CompanyProfile, type MemorandumInputs } from "@exit/engines";
import { canonicalValuationFor } from "../canonical-valuation";
import { ASSUMED_PROFILE_FIELDS } from "../company-intake";
import { codeNameFor } from "../listings";

/** The one set of engine inputs every memorandum is generated from — the Document
 *  Generator, the Banker and the CIM report page all call this, so the same company
 *  produces the same CIM wherever it is shown. Undefined fields fall back to the
 *  engine hook's demo defaults (demo mode only). */
export function memorandumInputs(company: CompanyProfile, fromIntake: boolean): Partial<MemorandumInputs> {
  const codeName = codeNameFor(company, !fromIntake);
  if (!fromIntake) return { codeName, timeline: DEFAULT_PROCESS_TIMELINE };
  const institutional = runInstitutionalValuation(company);
  return {
    codeName, timeline: DEFAULT_PROCESS_TIMELINE, company, assumed: ASSUMED_PROFILE_FIELDS,
    valuation: canonicalValuationFor(company, institutional),
    constitution: institutional,
    readiness: runReadiness(company),
    buyers: runBuyerDiscovery(company, { limit: 12 }),
    diligence: runDueDiligence(company),
  };
}
