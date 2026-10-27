import { describe, expect, it } from "vitest";
import { checkTerminology, parseAnswer, parseBookRules, selectEvidence, splitQuoted, systemPrompt, userPrompt, validateAnswer, type Evidence } from "../../../supabase/functions/_shared/teacher-core";

const RULES = parseBookRules("Write Yahusha instead of Jesus\nWrite Yahuah instead of God (never Jehovah or Yahweh)\nKeep all scripture references exactly as written.");
const ev = (handle: string, text: string, extra: Partial<Evidence> = {}): Evidence => ({ handle, chunk_id: `book:ch-02:${handle}`, version_id: "v1", text, source_title: "Demonology", source_location: "Chapter 2 ¶3", chapter_id: "ch-02", chapter_number: 2, heading_path: ["Spirits"], char_start: 1000, char_end: 1000 + text.length, source_role: "required", ...extra });
const E = [ev("E1", "The people of the ancient world did not doubt that spirits were real. Yahuah's people lived among nations whose texts are full of them."), ev("E2", "In Babylon the priests wrote long incantations against the spirits that brought fever.")];

describe("book rules", () => {
  it("turns the author's rules into structured term rules, keeping other lines as instructions", () => {
    expect(RULES[0]).toMatchObject({ kind: "required_term", term: "Yahusha", replaces: ["Jesus"], exceptions: ["direct_quote"] });
    expect(RULES[1]).toMatchObject({ kind: "required_term", term: "Yahuah", replaces: ["God", "Jehovah", "Yahweh"] });
    expect(RULES[2]).toMatchObject({ kind: "instruction", text: "Keep all scripture references exactly as written." });
  });

  it("flags forbidden words in the tutor's prose but never inside a quotation", () => {
    expect(checkTerminology("The author says God's people lived among nations.", RULES).map((v) => v.word)).toEqual(["God"]);
    expect(checkTerminology('The source reads “the God of Israel”, which the author discusses.', RULES)).toEqual([]);
    expect(checkTerminology("Yahuah's people and Yahusha's teaching.", RULES)).toEqual([]);
    expect(checkTerminology("A godly life; Jesuit schools.", RULES)).toEqual([]); // whole words only
    expect(splitQuoted('a "b" c').map((p) => p.quoted)).toEqual([false, true, false]);
  });
});

describe("answer validation", () => {
  it("accepts a grounded answer and resolves its citations from the stored passage", () => {
    const a = parseAnswer('```json\n{"status":"answered","answer":"The author says the ancient world took spirits as real.","claims":[{"text":"Ancient peoples did not doubt spirits were real.","evidence":["E1"]}],"citations":[{"evidence":"E1","quote":"did not   doubt that spirits were real"}],"limitations":[],"check_question":null}\n```');
    const v = validateAnswer(a, E, RULES);
    expect(v.ok).toBe(true);
    expect(v.claims[0].evidence[0]).toEqual({ evidence_id: "book:ch-02:E1", source_title: "Demonology", source_location: "Chapter 2 ¶3" });
    // the quote shown is the stored text, at its exact offsets in the book
    expect(v.citations[0].quote).toBe("did not doubt that spirits were real");
    expect(E[0].text.slice(v.citations[0].char_start - 1000, v.citations[0].char_end - 1000)).toBe("did not doubt that spirits were real");
  });

  it("rejects invented evidence, altered quotations, unsupported claims and forbidden terms", () => {
    const v = validateAnswer({ status: "answered", answer: "God's people lived among spirits.", claims: [{ text: "x", evidence: ["E9"] }], citations: [{ evidence: "E2", quote: "the priests wrote short incantations" }, { evidence: "E7", quote: "anything" }], limitations: [] }, E, RULES);
    expect(v.ok).toBe(false);
    expect(v.citations).toEqual([]);
    expect(v.problems.join("\n")).toMatch(/not supplied: E9/);
    expect(v.problems.join("\n")).toMatch(/no supporting evidence/);
    expect(v.problems.join("\n")).toMatch(/does not match E2 exactly/);
    expect(v.problems.join("\n")).toMatch(/not supplied: E7/);
    expect(v.problems.join("\n")).toMatch(/uses "God"; the book's rule is to write "Yahuah"/);
  });

  it("accepts an honest not-covered answer without claims", () => {
    const v = validateAnswer({ status: "not_covered", answer: "The available chapters do not say when the book was written.", claims: [], citations: [], limitations: ["No passage discusses the date."] }, E, RULES);
    expect(v.ok).toBe(true);
    expect(v.status).toBe("not_covered");
  });

  it("treats anything other than the JSON contract as a failure", () => {
    expect(parseAnswer("Sure! Here's what the book says.")).toBeNull();
    expect(validateAnswer(null, E, RULES)).toMatchObject({ ok: false, problems: ["The reply was not the required JSON."] });
  });
});

describe("prompt and evidence", () => {
  it("puts the stable rules first and the evidence and question last", () => {
    const sys = systemPrompt({ courseTitle: "Demonology", sources: [{ title: "Demonology", author: "The Author" }], rules: RULES, level: "student", mode: "ask" });
    expect(sys).toMatch(/Write "Yahuah", never "God" or "Jehovah" or "Yahweh"/);
    expect(sys).toMatch(/Keep all scripture references exactly as written/);
    expect(sys).toMatch(/Do not fill gaps with general knowledge/);
    const user = userPrompt(E, "What did the ancient world believe?");
    expect(user.indexOf("[E1] Demonology · Chapter 2 ¶3")).toBeLessThan(user.indexOf("STUDENT QUESTION"));
  });

  it("selects the best 5–8 passages without padding with weak ones", () => {
    const ranked = Array.from({ length: 20 }, (_, i) => ({ score: 1 / (60 + i) }));
    expect(selectEvidence(ranked)).toHaveLength(8);
    expect(selectEvidence([{ score: 1 }, { score: 0.9 }, { score: 0.1 }, { score: 0.1 }, { score: 0.1 }, { score: 0.1 }, { score: 0.1 }])).toHaveLength(5);
    expect(selectEvidence([])).toEqual([]);
  });
});
