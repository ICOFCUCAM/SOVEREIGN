import { describe, expect, it } from "vitest";
import { bookFileName } from "./book-export";

describe("book file names", () => {
  it("names a working draft as a draft, and the approved book plainly", () => {
    expect(bookFileName("Demonology I", "docx", { draft: true })).toBe("Demonology_I_draft.docx");
    expect(bookFileName("Demonology I", "epub")).toBe("Demonology_I.epub");
    expect(bookFileName("", "md")).toBe("book.md");
  });
});
