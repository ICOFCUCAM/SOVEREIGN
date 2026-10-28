import { describe, expect, it } from "vitest";
import { ALL_IDS, DEFAULT_CONFIG, DEMONOLOGY_TRANSFORMATION, GROUPS, PRESETS, auditOnly, buildInstruction, presetState, restructures } from "./rewrite-panel";

const cfg = (p: Partial<typeof DEFAULT_CONFIG>) => ({ ...DEFAULT_CONFIG, ...p });
const preset = (id: string) => PRESETS.find((p) => p.id === id)!.ids;

describe("book rewrite control panel", () => {
  it("has every group of the brief, A to K, with a label and an explanation for each operation", () => {
    expect(GROUPS.map((g) => g.title[0])).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]);
    expect(ALL_IDS).toHaveLength(108);
    for (const g of GROUPS) for (const o of g.options) { expect(o.label.length).toBeGreaterThan(10); expect(o.help.length).toBeGreaterThan(5); }
    for (const p of PRESETS) for (const id of p.ids) expect(ALL_IDS).toContain(id);
  });

  it("keeps the owner's Demonology instruction word for word", () => {
    expect(DEMONOLOGY_TRANSFORMATION.startsWith("COMPLETE BOOK TRANSFORMATION — DEMONOLOGY: THE BATTLE OF ANGELS")).toBe(true);
    expect(DEMONOLOGY_TRANSFORMATION).toContain("Replace Jesus with Yahusha.");
    expect(DEMONOLOGY_TRANSFORMATION.trim().endsWith("using the original manuscript as the source of truth.")).toBe(true);
  });

  it("knows the active preset and says when it was changed by hand", () => {
    expect(presetState(cfg({ preset: "complete", selected: preset("complete") }))).toEqual({ matches: "complete", modified: false });
    expect(presetState(cfg({ preset: "complete", selected: preset("complete").filter((i) => i !== "e4") })).modified).toBe(true);
    expect(presetState(cfg({ preset: "custom", selected: ["a1"] })).modified).toBe(false);
  });

  it("writes a readable instruction with only the chosen operations, the project, and the rules that always apply", () => {
    const text = buildInstruction(cfg({ title: "Demonology", subtitle: "The Battle of Angels", terminology: "Replace Jesus with Yahusha.", preset: "complete", selected: preset("complete"), workflow: "approval" }));
    expect(text).toContain("# Book rewrite: Demonology: The Battle of Angels");
    expect(text).toContain("Approval mode:");
    expect(text).toContain("### Book structure");
    expect(text).toContain("- Merge genuinely overlapping chapters.");
    expect(text).toContain("## Terminology rules\nReplace Jesus with Yahusha.");
    expect(text).toContain("./out/rewrite-fidelity.md");
    expect(text).toContain("The original manuscript in ./source/ must remain untouched");
    expect(text).not.toContain("Require approval of the proposed table of contents"); // said once, as the workflow
    expect(text).not.toContain("Do not merge chapters unless");
  });

  it("says plainly what unticked operations mean, without contradicting the ticked ones", () => {
    const noRemoval = buildInstruction(cfg({ preset: "no-removal", selected: preset("no-removal") }));
    expect(noRemoval).toContain("Do not merge chapters unless the owner approves it");
    expect(noRemoval).toContain("Do not delete or consolidate content");
    expect(noRemoval).not.toContain("- Remove accidental duplication.");
    const pub = cfg({ preset: "publication", selected: preset("publication") });
    expect(restructures(pub)).toBe(false);
    expect(buildInstruction(pub)).toContain("Keep the existing chapters, in the same order");
    const audit = cfg({ preset: "audit", selected: preset("audit") });
    expect(auditOnly(audit)).toBe(true);
    expect(buildInstruction(audit)).toContain("This is an audit, not a rewrite");
    expect(buildInstruction(audit)).not.toContain("./out/rewrite.md:");
  });
});
