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

beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); localStorage.clear(); sessionStorage.clear(); localStorage.setItem("studio.onboarded", "1"); localStorage.setItem("studio.place", "write"); window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {} })) as never; });

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
    // the text before the change is in the section's version history, and can be restored without losing the new text
    expect(f.saved().sections[0].versions?.at(-1)).toMatchObject({ kind: "before-accept", body: "God's people lived among nations.\n\nThese spirits had names." });
    fireEvent.click(screen.getByRole("button", { name: "Version history" }));
    const sheet = await screen.findByRole("dialog");
    fireEvent.click(within(sheet).getByRole("button", { name: /Restore/ }));
    await waitFor(() => expect(f.saved().sections[0].body).toBe("God's people lived among nations.\n\nThese spirits had names."), { timeout: 3000 });
    expect(f.saved().sections[0].versions?.at(-1)).toMatchObject({ kind: "before-restore", body: "Yahuah's people lived among nations.\n\nThese spirits had names." });
  });

  it("reviews changes from the keyboard: J moves, X rejects, ⌘↵ accepts", async () => {
    const f = fake();
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const panel = await screen.findByRole("complementary", { name: "Claude" });
    fireEvent.click(within(panel).getByRole("button", { name: /Rewrite with my idea/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Review the changes" }));
    const key = (k: string, o: KeyboardEventInit = {}) => act(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: k, ...o })); });
    key("j"); key("x"); // change 2 ("many") rejected
    expect(screen.getByRole("button", { name: /Added: change 2 of 2/ }).getAttribute("aria-pressed")).toBe("false");
    key("Enter", { ctrlKey: true });
    await waitFor(() => expect(f.saved().sections[0].body).toBe("Yahuah's people lived among nations.\n\nThese spirits had names."), { timeout: 3000 });
  });

  it("undoes and redoes a change to the book, independently of Claude", async () => {
    const f = fake();
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const body = await screen.findByLabelText("Spirits in the Ancient Near East text");
    fireEvent.change(body, { target: { value: "A new opening." } });
    fireEvent.click(screen.getByRole("button", { name: /^Undo/ }));
    await waitFor(() => expect((screen.getByLabelText("Spirits in the Ancient Near East text") as HTMLTextAreaElement).value).toBe("God's people lived among nations.\n\nThese spirits had names."));
    fireEvent.click(screen.getByRole("button", { name: /^Redo/ }));
    await waitFor(() => expect((screen.getByLabelText("Spirits in the Ancient Near East text") as HTMLTextAreaElement).value).toBe("A new opening."));
  });

  it("asks before a run billed to the API, and runs nothing when cancelled", async () => {
    const f = fake();
    render(<MemoryRouter><Workspace {...props(f.backend)} decision={{ ...decision, active: "api" }} /></MemoryRouter>);
    const panel = await screen.findByRole("complementary", { name: "Claude" });
    fireEvent.click(within(panel).getByRole("button", { name: /Read it/ }));
    const ask = await screen.findByRole("dialog", { name: /billed to the API/ });
    expect(within(ask).getByText(/About 9 words of your book/)).toBeTruthy();
    fireEvent.click(within(ask).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(f.runs).toHaveLength(0);
    fireEvent.click(within(panel).getByRole("button", { name: /Read it/ }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Run on the API/ }));
    await waitFor(() => expect(f.runs).toHaveLength(1));
  });

  it("offers back changes kept on this device that the server never received", async () => {
    const f = fake();
    const local = { ...f.saved(), sections: f.saved().sections.map((x) => (x.id === "c1" ? { ...x, body: "Written offline." } : x)) };
    localStorage.setItem("studio.unsaved.t1", JSON.stringify({ at: new Date().toISOString(), manuscript: local }));
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Put them back" }));
    await waitFor(() => expect(f.saved().sections[0].body).toBe("Written offline."), { timeout: 3000 });
    await waitFor(() => expect(localStorage.getItem("studio.unsaved.t1")).toBeNull());
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

  it("walks a first-time owner through the four stages once, then never again", async () => {
    localStorage.removeItem("studio.onboarded");
    const f = fake();
    const { unmount } = render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const tour = await screen.findByRole("dialog", { name: "From manuscript to published book" });
    for (const stage of ["Sources", "Plan", "Write", "Finish"]) expect(within(tour).getByRole("button", { name: stage })).toBeTruthy();
    for (let i = 0; i < 4; i++) fireEvent.click(within(tour).getByRole("button", { name: /^Next/ }));
    expect(await within(tour).findByText("A few shortcuts", {}, { timeout: 3000 })).toBeTruthy();
    fireEvent.click(within(tour).getByRole("button", { name: /Start with Sources/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(localStorage.getItem("studio.onboarded")).toBe("1");
    expect(localStorage.getItem("studio.place")).toBe("sources");
    unmount();
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    await screen.findByRole("heading", { name: "Sources and rules" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
