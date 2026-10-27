import { describe, expect, it } from "vitest";
import { REWRITE_POLICY, SECTION_POLICY } from "./studio-tools";
// The runner is a separate service; its prompts are plain ES modules.
import * as runner from "../../../../services/polished-claude-runner/src/prompts.mjs";

describe("rewrite editorial standard", () => {
  it("is word for word the same on Claude Code and on the API", () => {
    expect(REWRITE_POLICY).toEqual((runner as { REWRITE_POLICY: string[] }).REWRITE_POLICY);
    expect(SECTION_POLICY).toEqual((runner as { SECTION_POLICY: string[] }).SECTION_POLICY);
  });
});
