import { describe, expect, it } from "vitest";
import { EDITORIAL_REVIEW, REWRITE_POLICY, SECTION_POLICY, toolApiPlan } from "./studio-tools";
// The runner is a separate service; its prompts are plain ES modules.
import * as runner from "../../../../services/polished-claude-runner/src/prompts.mjs";

describe("rewrite editorial standard", () => {
  it("is word for word the same on Claude Code and on the API", () => {
    expect(REWRITE_POLICY).toEqual((runner as { REWRITE_POLICY: string[] }).REWRITE_POLICY);
    expect(SECTION_POLICY).toEqual((runner as { SECTION_POLICY: string[] }).SECTION_POLICY);
    expect(EDITORIAL_REVIEW).toBe((runner as { EDITORIAL_REVIEW: string }).EDITORIAL_REVIEW);
  });

  it("labels the judgement-level review as a model's reading, on both engines", () => {
    const api = toolApiPlan("editorial-review", {})!;
    expect(api.finish!(["notes"])).toContain("# Editorial review (Claude's judgement)");
    expect(api.finish!(["notes"])).toContain("not a check");
    const r = (runner as { buildRun: (a: string, o: object) => { prompt: string; output: string } }).buildRun("tool", { tool: "editorial-review", target: "rewrite.md" });
    expect(r.output).toBe("editorial-review.md");
    expect(r.prompt).toContain("not a check");
    expect(r.prompt).toContain("the file ./out/rewrite.md");
  });
});
