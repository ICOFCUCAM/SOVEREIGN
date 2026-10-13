import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { gateDocument, gateMessage, type GateResult } from "../lib/documents/gate";
import { INTAKE_FIELD_LABEL } from "../lib/intake-fields";

/** The pre-generation gate for a document about to be shown, copied or exported. */
export function useDocumentGate(typeId: string, text: string | null | undefined, valuationMidUsd?: number): GateResult | null {
  const { company, unconfirmed } = useMemo(() => loadActiveCompany(), []);
  return useMemo(
    () => (text ? gateDocument(typeId, text, { company, unconfirmed, ...(valuationMidUsd ? { valuationMidUsd } : {}) }) : null),
    [typeId, text, company, unconfirmed, valuationMidUsd],
  );
}

/** What the gate found, in one line beside the export action (nothing when clear). */
export const GateNotice: React.FC<{ gate: GateResult | null; className?: string }> = ({ gate, className = "" }) => {
  const msg = gate ? gateMessage(gate, INTAKE_FIELD_LABEL) : null;
  if (!msg) return null;
  return <p role={gate?.blocked ? "alert" : "note"} className={`text-[12px] ${gate?.blocked ? "text-xo-risk" : "text-xo-caution"} ${className}`}>{msg}</p>;
};
