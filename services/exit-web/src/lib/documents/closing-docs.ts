import type { CompanyProfile, SectionCoverage } from "@exit/engines";
import type { ContentSection } from "./ddm";
import type { TransactionDoc, OfferTerms } from "./transaction-docs";
import type { TransactionRecord, TxnItem, Gate, OwnerParty } from "../transactions";

// ── CLOSING DOCUMENTS (deliverable 6) ───────────────────────────────
// Built only from the transaction record the server holds: the accepted price and terms
// snapshotted when the transaction opened, the conditions with their evidence and the other
// party's confirmation, and each party's confirmation of signing and completion. Nothing is
// filled in. A figure the record does not hold (net debt, working capital, the buyer's legal
// entity, the signing officer) reads "Not yet supplied". ExitOS holds no funds, checks no bank
// record and drafts no binding instrument: the definitive agreement, the certificate and the
// announcement are for the parties' counsel, and each document says so.

const usd = (n: number): string => `$${(n / 1e6).toFixed(1)}M`;
const pct = (n: number): string => `${Math.round(n * 1000) / 10}%`;
const day = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : "");
const NS = "Not yet supplied";
const OWNER: Record<OwnerParty, string> = { seller: "Seller", buyer: "Buyer", both: "Both parties" };
const NOTICES = ["Prepared from the transaction record on ExitOS: the accepted terms and what each party recorded and the other confirmed. ExitOS holds no funds and checks no bank or legal record."];
const STATUS: Record<TxnItem["status"], string> = { open: "Open", evidenced: "Evidence recorded, awaiting confirmation", satisfied: "Satisfied (confirmed by the other party)", waived: "Waived by both parties" };

export interface ClosingInput { readonly company: CompanyProfile; readonly record: TransactionRecord; readonly buyerLabel: string }

const gateItems = (r: TransactionRecord, g: Gate): TxnItem[] => r.items.filter((i) => i.gate === g);
const evidenceOf = (i: TxnItem): string =>
  i.status === "waived" ? `Waived${i.note ? `: ${i.note}` : ""}` : i.evidence ? `${i.evidence.description}${i.evidence.documentName ? ` (${i.evidence.documentName})` : ""}${i.evidence.documentSha256 ? `, SHA-256 ${i.evidence.documentSha256.slice(0, 12)}…` : ""}` : "None recorded";
const itemRows = (items: readonly TxnItem[]): string[][] =>
  items.map((i) => [i.title, OWNER[i.owner_party], `${STATUS[i.status]}${i.required ? "" : " · not required"}`, evidenceOf(i)]);

/** The consideration split the accepted offer stated, as rows; a share the buyer did not give is missing. */
function consideration(price: number, t: OfferTerms): { rows: string[][]; missing: string[]; cashAtCompletion: number | null } {
  const rows: string[][] = []; const missing: string[] = [];
  const line = (label: string, share: number | undefined, extra = ""): void => {
    if (share == null) { missing.push(label.toLowerCase()); return; }
    if (share === 0) return;
    rows.push([label, pct(share), usd(price * share), extra]);
  };
  const cashNet = t.cashPct != null ? t.cashPct - (t.escrowPct ?? 0) : undefined;
  line("Cash paid at completion", cashNet, t.escrowPct != null ? "after the escrow is withheld" : "");
  line("Escrow or holdback", t.escrowPct, t.escrowMonths ? `held for ${t.escrowMonths} months` : "");
  line("Shares in the buyer", t.stockPct);
  line("Earn-out", t.earnoutPct, t.earnoutMonths ? `measured over ${t.earnoutMonths} months` : "");
  line("Management rollover", t.rolloverPct);
  return { rows, missing, cashAtCompletion: cashNet != null ? price * cashNet : null };
}

const cov = (section: string, status: SectionCoverage["status"], missing: string[] = []): SectionCoverage => ({ section, status, missing });

// ── 1 · Definitive agreement: drafting brief for counsel ────────────
export function spaBrief({ company, record: r, buyerLabel }: ClosingInput): TransactionDoc {
  const t = r.txn.terms ?? {};
  const c = consideration(r.txn.price_usd, t);
  const signing = gateItems(r, "signing"), closing = gateItems(r, "closing");
  const sections: ContentSection[] = [
    { heading: "Summary", body: `Brief for the parties' counsel drafting the definitive agreement for the sale of ${company.name} to ${buyerLabel} at a headline price of ${usd(r.txn.price_usd)}. It restates the terms the buyer proposed and the seller accepted on ExitOS, and the conditions both parties recorded. It is not the agreement and has not been reviewed by counsel.` },
    { heading: "Parties", bullets: [`Seller: the shareholders of ${company.name} (${NS.toLowerCase()}: the selling shareholders and their holdings)`, `Company: ${company.name}`, `Buyer: ${buyerLabel} (${NS.toLowerCase()}: the buyer's legal entity)`] },
    { heading: "Price and consideration", body: c.missing.length ? `${NS} by the buyer: ${c.missing.join(", ")}.` : "Every element of the consideration was stated by the buyer.",
      ...(c.rows.length ? { table: { headers: ["Element", "Share", "Amount", "Note"], rows: c.rows } } : {}) },
    { heading: "Protections the buyer proposed", bullets: [
      t.indemnityCapPct != null ? `Indemnity cap of ${pct(t.indemnityCapPct)} of the price.` : `Indemnity cap: ${NS.toLowerCase()} by the buyer.`,
      t.financing ? `Financing as stated by the buyer: ${t.financing.replace(/_/g, " ")}.` : `Financing: ${NS.toLowerCase()} by the buyer.`,
      ...(t.conditions ?? []).map((x) => `Condition the buyer stated: ${x}.`),
      ...(t.approvals ?? []).map((x) => `Approval the buyer stated: ${x}.`),
    ] },
    { heading: "Conditions to signing", table: { headers: ["Condition", "Owner", "Status", "Evidence"], rows: itemRows(signing) } },
    { heading: "Conditions to completion", table: { headers: ["Condition", "Owner", "Status", "Evidence"], rows: itemRows(closing) } },
    { heading: "Next steps: for counsel to draft", bullets: [
      "Warranties, the disclosure against them, and the limitation regime consistent with the cap above.",
      "Completion mechanics, the price adjustment (cash, debt and working capital) and the locked-box or completion-accounts choice.",
      "Treatment of employees, option holders and the management arrangements.",
      "Governing law, jurisdiction and dispute resolution.",
    ] },
  ];
  return { title: `Definitive Agreement — Drafting Brief`, subtitle: `${company.name} · ${buyerLabel}`, sections,
    coverage: [
      cov("Summary", "supported"), cov("Parties", "partial", ["selling shareholders", "buyer legal entity"]),
      cov("Price and consideration", c.missing.length ? "partial" : "supported", c.missing), cov("Protections the buyer proposed", t.indemnityCapPct != null ? "supported" : "partial"),
      cov("Conditions to signing", "supported"), cov("Conditions to completion", "supported"), cov("Next steps: for counsel to draft", "partial", ["counsel drafting"]),
    ],
    notices: NOTICES, producedBy: "lib/documents/closing-docs:spaBrief", inputs: { transaction: r.txn.id, state: r.txn.state } };
}

// ── 2 · Funds flow and closing statement ────────────────────────────
export function fundsFlow({ company, record: r, buyerLabel }: ClosingInput): TransactionDoc {
  const t = r.txn.terms ?? {};
  const c = consideration(r.txn.price_usd, t);
  const conf = (p: "seller" | "buyer") => r.confirmations.find((x) => x.milestone === "closing" && x.party === p);
  const s = conf("seller"), b = conf("buyer");
  const closed = r.txn.state === "closed";
  const statement: ContentSection = closed && s && b
    ? { heading: "Closing statement", body: `Completion was confirmed by both parties on ExitOS on ${day(r.txn.closed_at)}. Each stated the amount paid at completion; the transaction closed only because the two amounts matched. ExitOS did not see the payment: the references are the parties' own.`,
        ...(c.cashAtCompletion != null && Math.abs(Number(s.evidence.amountUsd) - c.cashAtCompletion) >= 50_000
          ? { bullets: [`The amount paid differs from the cash at completion in the split above by ${usd(Math.abs(Number(s.evidence.amountUsd) - c.cashAtCompletion))}. The adjustments at completion explain the difference; ExitOS does not hold them.`] } : {}),
        table: { headers: ["Party", "Amount stated as paid", "Payment reference", "Confirmed"], rows: [
          ["Seller", usd(Number(s.evidence.amountUsd)), s.evidence.reference, day(s.confirmed_at)],
          ["Buyer", usd(Number(b.evidence.amountUsd)), b.evidence.reference, day(b.confirmed_at)],
        ] } }
    : { heading: "Closing statement", body: `${NS}: completion has not been confirmed by both parties (the transaction is ${r.txn.state}). The statement is completed from their two confirmations at closing.` };
  const sections: ContentSection[] = [
    { heading: "Summary", body: `Funds flow for the sale of ${company.name} to ${buyerLabel} at a headline price of ${usd(r.txn.price_usd)}, split as the buyer proposed and the seller accepted. ExitOS holds and moves no funds. The paying agent or counsel prepares the final schedule with bank details.` },
    { heading: "Consideration at the headline price", body: c.missing.length ? `${NS} by the buyer: ${c.missing.join(", ")}. The split below covers only what was stated.` : "Every element was stated by the buyer.",
      ...(c.rows.length ? { table: { headers: ["Element", "Share", "Amount", "Note"], rows: c.rows } } : {}) },
    { heading: "Adjustments at completion", body: `${NS}: cash, debt, working capital and transaction costs at completion. ExitOS holds none of these; the amount paid will differ from the split above once counsel and the accountants apply them.` },
    statement,
    { heading: "Basis of preparation", body: "Prepared from the price and terms recorded when the transaction opened and from the parties' confirmations. It is not a payment instruction." },
    { heading: "Next steps", body: closed
      ? "Keep this statement with the completion bundle. The escrow release and any earn-out are tracked in the post-closing register."
      : "Counsel or the paying agent turns the split into the completion schedule, with bank details and the adjustments, for both parties to approve. At completion each party confirms on ExitOS the amount paid and its payment reference." },
  ];
  return { title: "Funds Flow and Closing Statement", subtitle: `${company.name} · ${buyerLabel}`, sections,
    coverage: [
      cov("Summary", "supported"), cov("Consideration at the headline price", c.missing.length ? "partial" : "supported", c.missing),
      cov("Adjustments at completion", "gap", ["cash", "debt", "working capital", "transaction costs"]),
      cov("Closing statement", closed ? "supported" : "gap", closed ? [] : ["confirmation of completion"]), cov("Basis of preparation", "supported"), cov("Next steps", "supported"),
    ],
    notices: NOTICES, producedBy: "lib/documents/closing-docs:fundsFlow", inputs: { transaction: r.txn.id, state: r.txn.state } };
}

// ── 3 · Bring-down certificate, draft for counsel ───────────────────
export function bringDownDraft({ company, record: r, buyerLabel }: ClosingInput): TransactionDoc {
  if (r.txn.state !== "signed" && r.txn.state !== "closed") throw new Error("A bring-down certificate follows signing: the transaction has not been signed.");
  const sig = r.confirmations.find((x) => x.milestone === "signing" && x.party === "seller");
  const item = r.items.find((i) => i.gate === "closing" && /bring-down/i.test(i.title));
  const sections: ContentSection[] = [
    { heading: "Summary", body: `Draft certificate to be given by ${company.name} at completion, confirming that the warranties in the definitive agreement signed on ${day(r.txn.signed_at)} remain true at completion. It is a draft for counsel; it binds no one until signed by an authorised officer.` },
    { heading: "Parties", bullets: [`Given by: ${company.name}, acting by an authorised officer (${NS.toLowerCase()}: the officer's name and title)`, `Given to: ${buyerLabel}`] },
    { heading: "Terms of the certificate", bullets: [
      `The warranties given in the agreement signed on ${day(r.txn.signed_at)} are true and accurate at completion as if repeated then, except as disclosed in the schedule to this certificate.`,
      "The company has performed the obligations the agreement requires of it before completion.",
      "No event has occurred that the agreement treats as a material adverse change.",
    ] },
    { heading: "Exceptions to disclose", body: `${NS}: any matter arising between signing and completion that makes a warranty untrue. The seller lists these with counsel; ExitOS records none.` },
    { heading: "Timing and status", body: `${sig ? `The agreement was identified at signing by SHA-256 ${sig.evidence.documentSha256.slice(0, 16)}…, which both parties confirmed. ` : ""}${item ? `On ExitOS the bring-down condition is: ${STATUS[item.status].toLowerCase()}.` : ""}` },
  ];
  return { title: "Bring-Down Certificate — Draft", subtitle: `${company.name} · ${buyerLabel}`, sections,
    coverage: [cov("Summary", "supported"), cov("Parties", "partial", ["signing officer"]), cov("Terms of the certificate", "partial", ["counsel review"]),
      cov("Exceptions to disclose", "gap", ["exceptions since signing"]), cov("Timing and status", "supported")],
    notices: NOTICES, producedBy: "lib/documents/closing-docs:bringDownDraft", inputs: { transaction: r.txn.id, state: r.txn.state } };
}

// ── 4 · Conditions, consents and filings register ───────────────────
export function conditionsRegister({ company, record: r, buyerLabel }: ClosingInput): TransactionDoc {
  const signing = gateItems(r, "signing"), closing = gateItems(r, "closing");
  const open = [...signing, ...closing].filter((i) => i.required && i.status !== "satisfied" && i.status !== "waived");
  const added = [...signing, ...closing].filter((i) => i.source === "added").length;
  const sections: ContentSection[] = [
    { heading: "Status", body: `${company.name} and ${buyerLabel}: the transaction is ${r.txn.state}. ${open.length ? `${open.length} required item${open.length === 1 ? " is" : "s are"} still open.` : "Every required item is satisfied or waived."} An item is satisfied only when the party that owns it records evidence and the other party confirms it; a waiver needs both parties.` },
    { heading: "Signing items", table: { headers: ["Item", "Owner", "Status", "Evidence"], rows: itemRows(signing) } },
    { heading: "Completion items", table: { headers: ["Item", "Owner", "Status", "Evidence"], rows: itemRows(closing) } },
    { heading: "Timing and next steps", body: `Opened on ${day(r.txn.created_at)}${r.txn.signed_at ? `; signed on ${day(r.txn.signed_at)}` : ""}${r.txn.closed_at ? `; completed on ${day(r.txn.closed_at)}` : ""}. ${added ? `${added} item${added === 1 ? " was" : "s were"} added by the parties to the standard set.` : "The parties have added nothing to the standard set."} Which consents and filings the deal needs is for counsel to confirm; ExitOS lists only what the parties recorded.` },
  ];
  return { title: "Conditions, Consents and Filings Register", subtitle: `${company.name} · ${buyerLabel}`, sections,
    coverage: [cov("Status", "supported"), cov("Signing items", "supported"), cov("Completion items", "supported"), cov("Timing and next steps", "supported")],
    notices: NOTICES, producedBy: "lib/documents/closing-docs:conditionsRegister", inputs: { transaction: r.txn.id, state: r.txn.state } };
}

// ── 5 · Post-closing obligations register ───────────────────────────
export function postClosingRegister({ company, record: r, buyerLabel }: ClosingInput): TransactionDoc {
  if (r.txn.state !== "closed") throw new Error("The post-closing register starts at completion: the transaction has not closed.");
  const items = gateItems(r, "post_closing").sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  const open = items.filter((i) => i.status !== "satisfied" && i.status !== "waived");
  const undated = items.filter((i) => !i.due_date).length;
  const sections: ContentSection[] = [
    { heading: "Summary", body: `Obligations continuing after the completion of the sale of ${company.name} to ${buyerLabel} on ${day(r.txn.closed_at)}. ${open.length} of ${items.length} remain open. Each is closed by its owner's evidence and the other party's confirmation.` },
    { heading: "Obligations", table: { headers: ["Obligation", "Owner", "Due", "Status"], rows: items.map((i) => [i.title, OWNER[i.owner_party], i.due_date ?? "No date set", STATUS[i.status]]) } },
    { heading: "Where the dates come from", body: "Escrow, earn-out and confidentiality dates were set at completion from the accepted terms and the NDA's survival period. The agreement itself governs; counsel confirms the dates against it." },
    { heading: "Next steps", body: `When an obligation is met, its owner records the evidence and the other party confirms it. ${undated ? `${undated} obligation${undated === 1 ? " has" : "s have"} no date: agree one with the other party.` : "Every obligation has a date."}` },
    { heading: "Basis of preparation", body: "ExitOS records what the parties state and confirm. It sends no reminders, holds no escrow and does not measure an earn-out." },
  ];
  return { title: "Post-Closing Obligations Register", subtitle: `${company.name} · ${buyerLabel}`, sections,
    coverage: [cov("Summary", "supported"), cov("Obligations", "supported"), cov("Where the dates come from", "supported"), cov("Next steps", undated ? "partial" : "supported"), cov("Basis of preparation", "supported")],
    notices: NOTICES, producedBy: "lib/documents/closing-docs:postClosingRegister", inputs: { transaction: r.txn.id, state: r.txn.state } };
}

// ── 6 · Completion announcement, draft ──────────────────────────────
export function announcementDraft({ company, record: r, buyerLabel }: ClosingInput): TransactionDoc {
  if (r.txn.state !== "closed") throw new Error("An announcement of completion follows completion: the transaction has not closed.");
  if (/^(the buyer|bidder [a-z])$/i.test(buyerLabel.trim())) throw new Error("Name the buyer as it will be announced: an announcement does not use a process label.");
  const sections: ContentSection[] = [
    { heading: "Summary", body: `Draft announcement that ${company.name} has been acquired by ${buyerLabel}, for both parties to approve. The price is left out: whether to disclose it is the parties' decision, and the agreement may restrict it.` },
    { heading: "Draft text", body: `${company.name} today announced that it has been acquired by ${buyerLabel}. The transaction completed on ${day(r.txn.closed_at)}. ${NS}: a statement from each party, what changes for customers and employees, and the advisers to name.` },
    { heading: "Next steps before release", bullets: [
      "Both parties approve the final text and the timing.",
      "Counsel confirms the announcement is consistent with the agreement and any disclosure rules that apply.",
      "Customers, employees and investors are told in the order the parties agree.",
    ] },
  ];
  return { title: "Completion Announcement — Draft", subtitle: company.name, sections,
    coverage: [cov("Summary", "supported"), cov("Draft text", "gap", ["party statements", "advisers"]), cov("Next steps before release", "supported")],
    notices: NOTICES, producedBy: "lib/documents/closing-docs:announcementDraft", inputs: { transaction: r.txn.id, state: r.txn.state } };
}
