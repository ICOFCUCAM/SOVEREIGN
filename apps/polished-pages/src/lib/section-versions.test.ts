import { describe, expect, it } from "vitest";
import type { Manuscript, Section } from "@/lib/manuscript";
import { AUTOSAVE_EVERY_MS, MAX_VERSIONS, addVersion, maybeAutosave, removeVersion, restoreVersion, versionsNewestFirst } from "@/lib/section-versions";

const sec = (body: string, extra: Partial<Section> = {}): Section => ({ id: "c1", kind: "chapter", title: "One", body, ...extra });

describe("section versions", () => {
  it("adds a named snapshot, and never repeats an unchanged unnamed version", () => {
    let s = addVersion(sec("First draft."), "snapshot", "  Sent to editor  ");
    expect(s.versions).toHaveLength(1);
    expect(s.versions![0]).toMatchObject({ kind: "snapshot", label: "Sent to editor", body: "First draft.", title: "One" });
    s = addVersion(s, "autosave");
    expect(s.versions).toHaveLength(1);
    s = addVersion({ ...s, body: "Second draft." }, "before-accept");
    expect(versionsNewestFirst(s).map((v) => v.kind)).toEqual(["before-accept", "snapshot"]);
  });

  it("keeps at most MAX_VERSIONS, dropping the oldest unnamed version before any snapshot", () => {
    let s = addVersion(sec("named"), "snapshot", "Keep me");
    for (let i = 0; i < MAX_VERSIONS + 5; i++) s = addVersion({ ...s, body: `draft ${i}` }, "autosave");
    expect(s.versions).toHaveLength(MAX_VERSIONS);
    expect(s.versions![0].label).toBe("Keep me");
    expect(s.versions!.at(-1)!.body).toBe(`draft ${MAX_VERSIONS + 4}`);
  });

  it("autosaves only when the last version is old enough and the section has text", () => {
    const t0 = new Date("2026-10-27T10:00:00Z");
    expect(maybeAutosave(sec(""), t0).versions).toBeUndefined();
    let s = maybeAutosave(sec("Text"), t0);
    expect(s.versions).toHaveLength(1);
    s = maybeAutosave({ ...s, body: "Text more" }, new Date(t0.getTime() + 60_000));
    expect(s.versions).toHaveLength(1);
    s = maybeAutosave({ ...s, body: "Text more" }, new Date(t0.getTime() + AUTOSAVE_EVERY_MS + 1));
    expect(s.versions).toHaveLength(2);
  });

  it("restores a version without losing the newer text", () => {
    const old = addVersion(sec("Old text.", { title: "Old title" }), "snapshot", "Old");
    const m: Manuscript = { title: "B", history: [], sections: [{ ...old, title: "New title", body: "New text." }] };
    const r = restoreVersion(m, "c1", old.versions![0].id).sections[0];
    expect(r.body).toBe("Old text.");
    expect(r.title).toBe("Old title");
    const kept = r.versions!.at(-1)!;
    expect(kept).toMatchObject({ kind: "before-restore", body: "New text.", title: "New title" });
    // restoring the kept version brings the newer text back
    expect(restoreVersion({ ...m, sections: [r] }, "c1", kept.id).sections[0].body).toBe("New text.");
    expect(restoreVersion(m, "c1", "missing").sections[0].body).toBe("New text.");
  });

  it("removes one version", () => {
    const s = addVersion(sec("A"), "snapshot", "x");
    expect(removeVersion(s, s.versions![0].id).versions).toEqual([]);
  });
});
