// Canonical institutional record types. The authoring forms (Create) carry the
// field specs per type; this is the shared name list used wherever a record type
// must be chosen without those specs — governance policy binding, policy pickers.
export const RECORD_TYPES: { docType: string; label: string }[] = [
  { docType: "executive_briefing", label: "Executive Briefing" },
  { docType: "board_report", label: "Board Report" },
  { docType: "policy_paper", label: "Policy Paper" },
  { docType: "situation_report", label: "Situation Report" },
  { docType: "intelligence_briefing", label: "Intelligence Briefing" },
  { docType: "ministerial_report", label: "Ministerial Report" },
  { docType: "strategic_memorandum", label: "Strategic Memorandum" },
  { docType: "regulatory_response", label: "Regulatory Response" },
  { docType: "research_dossier", label: "Research Dossier" },
  { docType: "investor_update", label: "Investor Update" },
  { docType: "proposal_package", label: "Proposal Package" },
  { docType: "press_release", label: "Press Release" },
  { docType: "meeting_minutes", label: "Meeting Minutes" },
  { docType: "risk_report", label: "Risk Report" },
  { docType: "audit_report", label: "Audit Report" },
  { docType: "due_diligence_report", label: "Due Diligence Report" },
  { docType: "white_paper", label: "White Paper" },
];

export const recordTypeLabel = (docType?: string): string =>
  RECORD_TYPES.find((t) => t.docType === docType)?.label ?? (docType ?? "—");
