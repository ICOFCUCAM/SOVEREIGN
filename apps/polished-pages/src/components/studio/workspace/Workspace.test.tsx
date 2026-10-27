import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Manuscript } from "@/lib/manuscript";
import type { RunOptions, StudioThread } from "@/lib/claude-studio";
import type { StudioBackend, EngineDecision } from "@/lib/studio-backend";
import Workspace from "./Workspace";

vi.mock("@/lib/documents", () => ({ saveDocument: vi.fn(async () => "doc-1"), updateDocument: vi.fn(), setTags: vi.fn(), listDocuments: vi.fn(async () => []), getDocument: vi.fn(), isAdmin: vi.fn(async () => true) }));

// The revision lifecycle of the design spec (§5.4), end to end in the workspace with a fake engine:
// understand → direction (idea, approach) → proposal → review change by change → accept (previous version kept).
const thread = { id: "t1", title: "Demonology", files: [{ name: "demonology.txt", storedAs: "demonology.txt", kind: "original", bytes: 100, at: "" }], outputs: [], messages: [] } as unknown as StudioThread;
const decision: EngineDecision = { active: "claude-code", tone: "ok", reason: "Claude Code is signed in." } as EngineDecision;

function fake() {
  let saved: Manuscript = { title: "Demonology", rules: "Write Yahuah instead of God", history: [], sections: [
    { id: "c1", kind: "chapter", title: "Spirits in the Ancient Near East", body: "God's people lived among nations.\n\nThese spirits had names." },
    { id: "c2", kind: "chapter", title: "Evil Spirits in the Hebrew Bible", body: "" },
  ] };
  const runs: RunOptions[] = [];
  const outputs: Record<string, string> = {
    "sections/c1-summary.md": "It traces belief in spirits.",
    "sections/c1.md": "Yahuah's people lived among many nations.\n\nThese spirits had names.",
    "sections/c1-notes.md": "### From your book\n\npages 14–22",
  };
  const backend = {
    storage: "runner",
    thread: async () => ({ thread, job: null }),
    manuscript: async () => saved,
    saveManuscript: async (_: string, m: Manuscript) => { saved = m; return m; },
    run: async (_id: string, _a: string, o: RunOptions) => { runs.push(o); return { id: `j${runs.length}`, label: "Section" }; },
    follow: async (_j: unknown, on: (e: unknown) => void) => {
      on({ type: "tool", line: "Reading source/demonology.txt" });
      const o = runs.at(-1)!;
      on({ type: "done", status: "done", outputs: o.op === "compose" ? [`sections/${o.sectionId}.md`, `sections/${o.sectionId}-notes.md`] : [] });
    },
    output: async (_id: string, p: string) => outputs[p],
    cancel: async () => {}, source: async () => null, rename: async () => thread, threads: async () => [],
  } as unknown as StudioBackend;
  return { backend, runs, saved: () => saved };
}

const props = (backend: StudioBackend) => ({
  id: "t1", backend, decision, mode: "auto" as const, onMode: () => {}, onCheckEngine: async () => {}, busy: false, busyElsewhere: false, ready: true,
  citationStyles: ["APA 7"], threads: [{ id: "t1", title: "Demonology", files: 1, outputs: 0 }] as never, onProject: () => {}, onNewProject: async () => {},
  handoff: null, onHandoffUsed: () => {}, onChanged: () => {}, onDeleted: () => {}, onWorkInStudio: async () => {}, onLearnVoice: async () => {},
});

beforeEach(() => { localStorage.clear(); localStorage.setItem("studio.place", "write"); window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {} })) as never; });

describe("Claude Studio workspace", () => {
  it("revises a chapter with Claude: summary, idea, approach, change-by-change review, accept keeps the previous version", async () => {
    const f = fake();
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const panel = await screen.findByRole("complementary", { name: "Claude" });

    fireEvent.click(within(panel).getByRole("button", { name: /Read it/ }));
    expect(await within(panel).findByText("It traces belief in spirits.")).toBeTruthy();

    fireEvent.change(within(panel).getByLabelText("Your idea for this section"), { target: { value: "Open with Mesopotamia" } });
    fireEvent.click(within(panel).getByRole("radio", { name: /My book \+ cited sources/ }));
    fireEvent.click(within(panel).getByRole("button", { name: /Rewrite with my idea/ }));
    await waitFor(() => expect(f.runs.at(-1)).toMatchObject({ sectionId: "c1", op: "compose", approach: "mine-and-research" }));

    // The suggestion waits; the text is unchanged until accepted.
    fireEvent.click(await screen.findByRole("button", { name: "Review the changes" }));
    expect(screen.getByText(/source policy: manuscript \+ references/)).toBeTruthy();
    const added = screen.getByRole("button", { name: /Added: change 2 of 2/ });
    fireEvent.click(added); // reject "many"
    expect(added.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: /^Accept$/ }));

    await waitFor(() => expect(f.saved().sections[0].body).toBe("Yahuah's people lived among nations.\n\nThese spirits had names."), { timeout: 3000 });
    expect(f.saved().sections[0]).toMatchObject({ original: "God's people lived among nations.\n\nThese spirits had names.", idea: "Open with Mesopotamia" });
    expect(f.saved().history.at(-1)).toMatchObject({ sectionId: "c1", op: "compose", accepted: true });
  });

  it("adds a note on a page in Notes, and opens focus mode and leaves it with Escape", async () => {
    const f = fake();
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const panel = await screen.findByRole("complementary", { name: "Claude" });
    fireEvent.click(within(panel).getByRole("tab", { name: /Notes/ }));
    fireEvent.change(within(panel).getByLabelText("Page"), { target: { value: "14" } });
    fireEvent.change(within(panel).getByLabelText("Note"), { target: { value: "Keep this sentence word for word." } });
    fireEvent.click(within(panel).getByRole("button", { name: "Add the note" }));
    await waitFor(() => expect(f.saved().sections[0].pageNotes).toEqual([{ page: "14", text: "Keep this sentence word for word." }]), { timeout: 3000 });

    fireEvent.click(screen.getByRole("button", { name: /Focus mode/ }));
    expect(screen.queryByRole("complementary", { name: "Claude" })).toBeNull();
    act(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    expect(await screen.findByRole("complementary", { name: "Claude" })).toBeTruthy();
  });
});
