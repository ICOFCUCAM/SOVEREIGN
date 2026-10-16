import { describe, it, expect } from "vitest";
import { portfolioRows, liveSales, type PortfolioInput } from "./portfolio.js";

const co = (id: string, o: Partial<PortfolioInput> = {}): PortfolioInput => ({ id, name: id, active: false, listed: false, cim: false, teaser: false, ...o });

describe("a founder's portfolio", () => {
  it("each company's stage comes from its own listing and transactions", () => {
    const rows = portfolioRows(
      [co("a"), co("b", { listed: true }), co("c", { listed: true }), co("d", { listed: true }), co("e", { listed: true })],
      [{ company_id: "c", state: "negotiating" }, { company_id: "d", state: "signed" }, { company_id: "e", state: "closed" }, { company_id: "b", state: "terminated" }],
    );
    expect(rows.map((r) => r.stage)).toEqual(["not-listed", "listed", "in-deal", "signed", "sold"]);
    expect(liveSales(rows)).toBe(2);
  });
  it("preparation is ready only when both the CIM and the teaser are written", () => {
    const rows = portfolioRows([co("a", { cim: true, teaser: true }), co("b", { cim: true }), co("c")], []);
    expect(rows.map((r) => r.preparation)).toEqual(["ready", "partial", "none"]);
  });
  it("rows follow the founder's companies only", () => {
    expect(portfolioRows([], [{ company_id: "a", state: "closed" }])).toEqual([]);
  });
});
