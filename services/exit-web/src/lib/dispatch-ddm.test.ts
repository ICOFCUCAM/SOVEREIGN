import { describe, it, expect } from "vitest";
import { loadActiveCompany } from "./active-company";
import { buildBoardMemo } from "./report-docs";
import { boardMemoToDdm } from "./dispatch-ddm";

describe("ExitOS → Dispatch DDM mapper", () => {
  const { company } = loadActiveCompany();
  const ddm = boardMemoToDdm(buildBoardMemo(company));

  it("produces a valid executive_briefing scaffold with the required roles", () => {
    expect(ddm.ddmVersion).toBe("1.0");
    expect(ddm.docType).toBe("executive_briefing");
    const roles = ddm.sections.map((s) => s.role);
    for (const r of ["executive_summary", "key_judgements", "analysis", "recommendation"]) {
      expect(roles).toContain(r);
    }
  });

  it("carries the engine's real content into the right blocks", () => {
    const memo = buildBoardMemo(company);
    const summary = ddm.sections.find((s) => s.role === "executive_summary")!;
    expect((summary.blocks[0] as { text: string }).text).toBe(memo.recommendation);
    const kj = ddm.sections.find((s) => s.role === "key_judgements")!;
    expect((kj.blocks[0] as { items: unknown[] }).items.length).toBe(memo.highlights.length);
    const rec = ddm.sections.find((s) => s.role === "recommendation")!;
    expect((rec.blocks[0] as { type: string }).type).toBe("callout");
  });

  it("every section and block has an id (DDM requires stable ids)", () => {
    for (const s of ddm.sections) {
      expect(s.id).toBeTruthy();
      for (const b of s.blocks) expect(b.id).toBeTruthy();
    }
  });
});
