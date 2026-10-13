import { describe, it, expect } from "vitest";
import { SECTION_TITLE, EMPTY_STORY, storyStatus } from "@exit/engines";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { STORY_FORM, HEADLINE_FIGURES } from "./story-form";
import { INTAKE_FIELDS } from "./active-company";

describe("company story form", () => {
  it("has one editor for every story section, in the model's order", () => {
    expect(STORY_FORM.map((s) => s.id)).toEqual(storyStatus(EMPTY_STORY).map((s) => s.id));
    for (const s of STORY_FORM) expect(SECTION_TITLE[s.id]).toBeTruthy();
  });
  it("records the basis of every headline intake figure", () => {
    for (const [k] of HEADLINE_FIGURES) expect(INTAKE_FIELDS).toContain(k);
  });
  it("never offers 'independently verified' to the owner", () => {
    const page = readFileSync(resolve(__dirname, "../pages/CompanyStory.tsx"), "utf8");
    expect(page).toMatch(/\["founder", "source", "estimated", "missing"\]/);
    expect(JSON.stringify(STORY_FORM)).not.toMatch(/"verified"/);
  });
});
