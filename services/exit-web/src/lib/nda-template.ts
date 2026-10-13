// ExitOS's template NDA text. It is a founder draft: it has not been reviewed by counsel,
// it says so in its first line, and an NDA issued from it carries document_origin
// "exitos_template". Counsel-supplied text is issued as "seller_supplied".

export interface TemplateInputs { readonly companyCode: string; readonly accessTermMonths: number; readonly survivalMonths: number; readonly governingLaw?: string }

export function ndaTemplateText(i: TemplateInputs): string {
  const law = i.governingLaw?.trim() || "[governing law to be agreed]";
  return [
    "EXITOS TEMPLATE NDA — FOUNDER DRAFT, NOT REVIEWED BY COUNSEL",
    "",
    `MUTUAL NON-DISCLOSURE AGREEMENT concerning ${i.companyCode}`,
    "",
    "1. Purpose. The parties exchange Confidential Information solely to evaluate a possible acquisition of, or investment in, the company identified to the Recipient under this Agreement (the \"Purpose\").",
    "2. Confidential Information. All information disclosed by a party, in any form, that is marked confidential or would reasonably be understood to be confidential, including the fact that discussions are taking place.",
    "3. Obligations. The Recipient will use Confidential Information only for the Purpose, disclose it only to its representatives who need to know it and are bound by equivalent obligations, and protect it with at least reasonable care.",
    "4. Exclusions. Information that is or becomes public through no breach, was lawfully known before disclosure, is independently developed, or is lawfully received from a third party without restriction.",
    "5. Required disclosure. Where disclosure is required by law, the Recipient will, where lawful, give prompt notice and disclose only what is required.",
    `6. Term. Access to the data room under this Agreement lasts ${i.accessTermMonths} months from execution unless terminated earlier by either party in writing.`,
    `7. Survival. The obligations in sections 3 to 5 survive for ${i.survivalMonths} months after the end of the access term or termination.`,
    "8. Return or destruction. On request, the Recipient will return or destroy Confidential Information, subject to legal retention requirements.",
    "9. No obligation. Nothing in this Agreement obliges either party to proceed with any transaction.",
    `10. Governing law. ${law}.`,
  ].join("\n");
}
