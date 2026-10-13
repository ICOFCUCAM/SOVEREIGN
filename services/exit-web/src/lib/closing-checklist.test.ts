import { describe, it, expect } from "vitest";
import { CLOSING_ITEMS, closingRows, closingChecklistDoc, STATUS_LABEL } from "./closing-checklist";

describe("one closing checklist", () => {
  it("the export lists exactly the rows the Closing page shows: item, owner, timing, status", () => {
    const statuses = { "c-01": "done", "c-07": "blocked", "c-11": "in_progress" } as const;
    const rows = closingRows(statuses);
    const doc = closingChecklistDoc(statuses);
    expect(rows).toHaveLength(CLOSING_ITEMS.length);
    for (const r of rows) {
      const line = doc.split("\n").find((l) => l.includes(r.title));
      expect(line, r.title).toBeDefined();
      for (const cell of [r.owner, r.timing, STATUS_LABEL[r.status]]) expect(line).toContain(cell);
    }
    expect(doc).toContain("1 of 12 items marked done, 1 in progress, 1 blocked");
  });
  it("a status is a tracking note, not evidence of execution", () => {
    expect(closingChecklistDoc({})).toMatch(/not evidence of execution/);
  });
});
