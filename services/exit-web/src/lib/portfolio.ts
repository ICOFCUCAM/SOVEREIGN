import type { TxnState } from "./transactions";

// ── A FOUNDER'S PORTFOLIO ───────────────────────────────────────────
// Where each of the founder's companies stands, from its own records only: whether it is listed, whether
// its CIM and teaser are written, and the state of its sale. Nothing here bills or unlocks anything.

export type Stage = "not-listed" | "listed" | "in-deal" | "signed" | "sold";
export interface PortfolioInput {
  readonly id: string; readonly name: string; readonly active: boolean;
  readonly listed: boolean; readonly cim: boolean; readonly teaser: boolean;
}
export interface PortfolioRow extends PortfolioInput {
  readonly stage: Stage;
  readonly preparation: "ready" | "partial" | "none";
}

export const STAGE_LABEL: Record<Stage, string> = {
  "not-listed": "Not listed", listed: "Listed", "in-deal": "In negotiation", signed: "Signed", sold: "Sold",
};

/** Each company's stage, from the furthest of its transactions; an ended (terminated) one leaves the
 *  company where its listing puts it. */
export function portfolioRows(companies: readonly PortfolioInput[], txns: ReadonlyArray<{ company_id: string; state: TxnState }>): PortfolioRow[] {
  return companies.map((c) => {
    const states = txns.filter((t) => t.company_id === c.id).map((t) => t.state);
    const stage: Stage = states.includes("closed") ? "sold" : states.includes("signed") ? "signed" : states.includes("negotiating") ? "in-deal" : c.listed ? "listed" : "not-listed";
    return { ...c, stage, preparation: c.cim && c.teaser ? "ready" : c.cim || c.teaser ? "partial" : "none" };
  });
}

/** Companies whose sale is under way (negotiating or signed). */
export const liveSales = (rows: readonly PortfolioRow[]): number => rows.filter((r) => r.stage === "in-deal" || r.stage === "signed").length;
