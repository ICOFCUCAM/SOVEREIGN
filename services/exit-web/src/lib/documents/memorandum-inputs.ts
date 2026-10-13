import { runInstitutionalValuation, runReadiness, runBuyerDiscovery, runDueDiligence, DEFAULT_PROCESS_TIMELINE, type CompanyProfile, type MemorandumInputs } from "@exit/engines";
import { canonicalValuationFor } from "../canonical-valuation";
import { EMPTY_STORY, applyVerifications, cleanStory, type CompanyStory, type Verification } from "@exit/engines";
import { profileWithStory } from "../company-story";
import { codeNameFor } from "../listings";

/** The one set of engine inputs every memorandum is generated from — the Document
 *  Generator, the Banker and the CIM report page all call this, so the same company
 *  produces the same CIM wherever it is shown. Undefined fields fall back to the
 *  engine hook's demo defaults (demo mode only). */
export function memorandumInputs(base: CompanyProfile, fromIntake: boolean, rawStory: CompanyStory = EMPTY_STORY, verifications: readonly Verification[] = []): Partial<MemorandumInputs> {
  // documents are written from complete entries only, and a figure is "verified" only through a current verification record
  const story = applyVerifications(cleanStory(rawStory), verifications).story;
  const codeName = codeNameFor(base, !fromIntake);
  if (!fromIntake) return { codeName, timeline: DEFAULT_PROCESS_TIMELINE };
  // the story's facts replace the engines' neutral values; what it does not state stays assumed
  const { profile: company, assumed } = profileWithStory(base, story);
  const institutional = runInstitutionalValuation(company);
  return {
    codeName, timeline: DEFAULT_PROCESS_TIMELINE, company, assumed, story,
    valuation: canonicalValuationFor(company, institutional),
    constitution: institutional,
    readiness: runReadiness(company),
    buyers: runBuyerDiscovery(company, { limit: 12 }),
    diligence: runDueDiligence(company),
  };
}
