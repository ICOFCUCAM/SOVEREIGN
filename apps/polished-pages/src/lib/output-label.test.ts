import { describe, expect, it } from "vitest";
import { outputLabel, setSectionTitles } from "./claude-studio";

describe("result names", () => {
  it("names section suggestions after their section", () => {
    setSectionTitles({ "s-ab12": "The reality of the unseen" });
    expect(outputLabel("sections/s-ab12.md")).toBe("Suggestion · The reality of the unseen");
    expect(outputLabel("sections/s-ab12-summary.md")).toBe("What it says · The reality of the unseen");
    expect(outputLabel("sections/s-ab12-notes.md")).toBe("What Claude used · The reality of the unseen");
    expect(outputLabel("sections/s-gone.md")).toBe("Manuscript section suggestion");
    expect(outputLabel("book-design.json")).toBe("Design of the professional book");
    setSectionTitles({});
  });
});
