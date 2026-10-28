import { describe, expect, it } from "vitest";
import { RUNNER_LEVEL_NEEDED, runnerProblem, type StudioMe } from "./claude-studio";
import * as v from "../../../../services/polished-claude-runner/src/version.mjs";

const me = (runner?: StudioMe["runner"]) => ({ user: { id: "u", email: null }, claudeConnected: true, busy: null, citationStyles: [], runner }) as StudioMe;

describe("which runner the Studio talks to", () => {
  it("never needs more than the runner in this repository provides", () => {
    expect((v as { RUNNER_LEVEL: number }).RUNNER_LEVEL).toBeGreaterThanOrEqual(RUNNER_LEVEL_NEEDED);
  });
  it("says plainly when the deployed runner is old or can't read PDFs", () => {
    expect(runnerProblem(me())).toMatch(/older than the Studio.*Deploy main/);
    expect(runnerProblem(me({ level: 2, features: [], poppler: true }))).toMatch(/level 2, the Studio needs 4/);
    expect(runnerProblem(me({ level: 4, features: [], poppler: false }))).toMatch(/can't read PDF pages/);
    expect(runnerProblem(me({ level: 4, features: [], poppler: true }))).toBeNull();
  });
});
