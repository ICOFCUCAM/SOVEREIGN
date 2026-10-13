import { describe, it, expect } from "vitest";
import { mimeFor, safeFilename } from "./ui";

describe("downloads", () => {
  it("are saved with the media type of what is in them", () => {
    expect(mimeFor("a.md")).toBe("text/markdown;charset=utf-8");
    expect(mimeFor("a.csv")).toBe("text/csv;charset=utf-8");
    expect(mimeFor("closing-call.ics")).toBe("text/calendar;charset=utf-8");
    expect(mimeFor("x.json")).toBe("application/json");
    expect(mimeFor("intro.txt")).toBe("text/plain;charset=utf-8");
  });
  it("have filenames safe on every system", () => {
    expect(safeFilename("Zéphyr & Co — CIM (draft).md")).toBe("zephyr-co-cim-draft.md");
    expect(safeFilename("exitos_seller_report.MD")).toBe("exitos-seller-report.md");
    expect(safeFilename("../../etc/passwd")).not.toContain("/");
  });
});
