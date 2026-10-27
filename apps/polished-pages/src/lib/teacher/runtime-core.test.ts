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

import { decidePath, evidenceAnswer } from "../../../supabase/functions/_shared/teacher-core";

describe("knowledge-first answering (phase 0)", () => {
  it("never chooses a model unless AI answers are on, a provider is configured and the cap allows it", () => {
    const base = { evidence: 3, aiAnswers: true, modelAllowed: true, providerConfigured: true };
    expect(decidePath(base).path).toBe("model");
    expect(decidePath({ ...base, aiAnswers: false })).toMatchObject({ path: "evidence_only", reason: "ai_off", notice: null });
    expect(decidePath({ ...base, providerConfigured: false })).toMatchObject({ path: "evidence_only", reason: "not_configured" });
    expect(decidePath({ ...base, modelAllowed: false })).toMatchObject({ path: "evidence_only", reason: "cap_reached" });
    expect(decidePath({ ...base, evidence: 0 })).toMatchObject({ path: "not_covered" });
    // every combination with AI off avoids the model
    for (const modelAllowed of [true, false]) for (const providerConfigured of [true, false]) for (const evidence of [0, 1, 8])
      expect(decidePath({ evidence, aiAnswers: false, modelAllowed, providerConfigured }).path).not.toBe("model");
  });

  it("answers from the book's own words, saying where each passage comes from", () => {
    const a = evidenceAnswer([...E, ev("E3", "A third passage.", { source_location: "Chapter 5 ¶2" }), ev("E4", "x"), ev("E5", "y")]);
    expect(a.status).toBe("evidence");
    expect(a.passages).toHaveLength(4);
    expect(a.passages[0]).toMatchObject({ evidence_id: "book:ch-02:E1", text: E[0].text });
    expect(a.answer).toBe("Here is what Demonology says about this, from Chapter 2 and Chapter 5. These are the author's own words; open a passage to read it in context.");
  });
});

import { assessScope, insufficientAnswer, outOfScopeMessage } from "../../../supabase/functions/_shared/teacher-core";

describe("subject gate and sufficiency (phase 1)", () => {
  const t = (lexeme: string, in_course: number, in_evidence = 0) => ({ lexeme, in_course, in_evidence });

  it("declines a question whose words the course never uses, or that has no meaningful words", () => {
    // "What is the capital of France?" in a book that mentions neither
    expect(assessScope({ terms: [t("capit", 0), t("franc", 0)], best_passage_terms: 0 }, 0).verdict).toBe("out_of_scope");
    // one incidental word among many is not enough to make it the course's subject
    expect(assessScope({ terms: [t("capit", 2), t("franc", 0), t("popul", 0), t("paris", 0), t("europ", 0)], best_passage_terms: 0 }, 0).verdict).toBe("out_of_scope");
    expect(assessScope({ terms: [], best_passage_terms: 0 }, 0).verdict).toBe("out_of_scope");
  });

  it("tells an in-course question the book does not answer apart from an unrelated one", () => {
    const facts = { terms: [t("spirit", 40, 4), t("unclean", 12, 3), t("gadarene", 3, 0), t("swine", 2, 0)], best_passage_terms: 2 };
    expect(assessScope(facts, 5)).toMatchObject({ verdict: "insufficient", terms: 4, in_course: 4, in_evidence: 2 });
    // the words are spread across passages, but no single passage holds enough of them
    expect(assessScope({ terms: [t("a1", 1, 1), t("b2", 1, 1), t("c3", 1, 1), t("d4", 1, 1), t("e5", 1, 1)], best_passage_terms: 1 }, 5).verdict).toBe("insufficient");
    expect(assessScope({ terms: [t("spirit", 40, 4), t("unclean", 12, 3)], best_passage_terms: 2 }, 0).verdict).toBe("insufficient");
  });

  it("treats an on-topic story the book does not tell as not enough evidence, not as off-topic (live counts)", () => {
    // "Why were the swine of the Gadarenes drowned by spirits?" against a chapter on unclean spirits
    const facts = { terms: [t("drown", 0), t("gadaren", 0), t("spirit", 2, 2), t("swine", 0)], best_passage_terms: 1 };
    expect(assessScope(facts, 2).verdict).toBe("insufficient");
  });

  it("lets a well-supported question through", () => {
    // live counts for "What does chapter 1 teach about unclean spirits being cast out?" ("chapter", "teach" and "1" are ignored)
    expect(assessScope({ terms: [t("cast", 1, 1), t("spirit", 2, 1), t("unclean", 1, 1)], best_passage_terms: 3 }, 1).verdict).toBe("sufficient");
    expect(assessScope({ terms: [t("spirit", 40, 4), t("unclean", 12, 3), t("cast", 9, 2)], best_passage_terms: 2 }, 6).verdict).toBe("sufficient");
    expect(assessScope({ terms: [t("demon", 50, 6)], best_passage_terms: 1 }, 6).verdict).toBe("sufficient");
  });

  it("words the two refusals differently", () => {
    expect(outOfScopeMessage("Demonology")).toBe("I am your tutor for Demonology. I can help with the book and the approved course materials, but this question falls outside the subject I am teaching. Please ask me about a concept from the course.");
    const a = insufficientAnswer(E);
    expect(a.status).toBe("partially_covered");
    expect(a.answer).toBe("I found related material in Chapter 2, but the approved sources do not provide enough information to establish a complete answer. Here are the relevant passages you can review.");
    expect(a.passages).toHaveLength(E.length);
  });
});
