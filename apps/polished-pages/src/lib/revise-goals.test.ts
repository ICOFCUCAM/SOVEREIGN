import { describe, expect, it } from "vitest";
import { composeIdea } from "./revise-goals";
import { findCitations } from "./section-citations";

describe("revise goals and citations", () => {
  it("puts the owner's words first, then the goals and settings they chose", () => {
    expect(composeIdea("Open with Mesopotamia.", { goals: [], citations: "keep", scope: "full" })).toBe("Open with Mesopotamia.");
    const idea = composeIdea("Open with Mesopotamia.", { goals: ["flow", "preserve"], citations: "mark", scope: "light" });
    expect(idea.startsWith("Open with Mesopotamia.")).toBe(true);
    expect(idea).toMatch(/Improve the flow[\s\S]*Preserve the author's meaning[\s\S]*light edit[\s\S]*\[citation needed\]/);
  });
  it("finds scripture, author–year references and quotations in a section", () => {
    const f = findCitations(`He cannot lie (Titus 1:2; Hebrews 6:18). "I am the LORD, I change not" (Malachi 3:6). As one scholar wrote (Dyrness, 1979, pp. 41-42).\n\n> Hear, O Israel: Yahuah is one.`);
    expect(f.scripture).toEqual(["Titus 1:2", "Hebrews 6:18", "Malachi 3:6"]);
    expect(f.works).toEqual(["Dyrness, 1979, pp. 41-42"]);
    expect(f.quotations).toBe(2);
  });
});
