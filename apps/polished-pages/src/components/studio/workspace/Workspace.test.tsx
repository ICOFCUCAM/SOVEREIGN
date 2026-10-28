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
    fireEvent.click(within(panel).getByRole("button", { name: /Source policy/ }));
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
  }, 15_000); // walks the whole revision flow; slow under a full parallel run

  it("offers to continue a rewrite that stopped, where it stopped", async () => {
    const f = fake();
    const stoppedThread = { ...thread, messages: [{ id: "m1", role: "assistant", action: "rewrite", text: "Stopped.", at: "", jobId: "j0", status: "failed", resume: { action: "rewrite", options: { continueRun: true }, what: "2 chapters written" } }] } as unknown as StudioThread;
    (f.backend as unknown as { thread: unknown }).thread = async () => ({ thread: stoppedThread, job: null });
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    expect(await screen.findByText(/Claude stopped before finishing \(2 chapters written\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue where Claude stopped" }));
    await waitFor(() => expect(f.runs.at(-1)).toEqual({ continueRun: true }));
  });

  it("warns in Plan about a very long chapter and offers to organise it", async () => {
    const f = fake();
    (f.backend as unknown as { manuscript: unknown }).manuscript = async () => ({ title: "Oneness", history: [], sections: [{ id: "c1", kind: "chapter", title: "The_Oneness_of_God", body: "word ".repeat(74_770) }] });
    localStorage.setItem("studio.place", "plan");
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    expect(await screen.findByText(/“The_Oneness_of_God” is very long \(over 15,000 words: 74,770\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Organise into chapters and sections/ }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("finds and replaces across the book from Plan, leaving quotations unless chosen, and keeps the earlier text", async () => {
    const f = fake();
    (f.backend as unknown as { manuscript: unknown }).manuscript = async () => ({ title: "B", history: [], sections: [
      { id: "c1", kind: "chapter", title: "One", body: "Jesus taught them.\n\nHe said, “Jesus wept.”" },
      { id: "c2", kind: "chapter", title: "Two", body: "And Jesus went on." },
    ] });
    localStorage.setItem("studio.place", "plan");
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Find and replace/ }));
    fireEvent.change(screen.getByLabelText("Find"), { target: { value: "Jesus" } });
    fireEvent.change(screen.getByLabelText("Replace with"), { target: { value: "Yahusha" } });
    expect(screen.getByText(/3 matches · 2 chosen/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Replace 2 matches" }));
    await waitFor(() => expect(f.saved().sections.map((s) => s.body)).toEqual(["Yahusha taught them.\n\nHe said, “Jesus wept.”", "And Yahusha went on."]), { timeout: 3000 });
    expect(f.saved().sections[0].versions?.at(-1)?.body).toBe("Jesus taught them.\n\nHe said, “Jesus wept.”");
  });

  it("shows the writing formatted when asked, and goes back to the text with a click", async () => {
    const f = fake();
    (f.backend as unknown as { manuscript: unknown }).manuscript = async () => ({ title: "B", history: [], sections: [{ id: "c1", kind: "chapter", title: "One", body: "### The names\n\nThe **enemy** has names." }] });
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    expect(await screen.findByLabelText("One text")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show formatted" }));
    const shown = screen.getByRole("button", { name: /One text, formatted/ });
    expect(within(shown).getByRole("heading", { name: "The names" })).toBeTruthy();
    expect(within(shown).getByText("enemy").tagName).toBe("STRONG");
    fireEvent.click(shown);
    expect(screen.getByLabelText("One text")).toHaveValue("### The names\n\nThe **enemy** has names.");
  });

  it("shows the page design beside the Book page, and Claude when asked", async () => {
    const f = fake();
    localStorage.setItem("studio.view", "book");
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const design = await screen.findByRole("complementary", { name: "Page design" });
    expect(within(design).getByLabelText("Format")).toBeTruthy();
    expect(within(design).getByText("Scripture study")).toBeTruthy();
    fireEvent.click(within(design).getByRole("button", { name: /Ask Claude/ }));
    const claude = await screen.findByRole("complementary", { name: "Claude" });
    fireEvent.click(within(claude).getByRole("button", { name: "Page design" }));
    expect(await screen.findByRole("complementary", { name: "Page design" })).toBeTruthy();
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

  it("offers back changes kept on this device that the server never received, and clears them only after the server confirms", async () => {
    const f = fake();
    const local = { ...f.saved(), sections: f.saved().sections.map((x) => (x.id === "c1" ? { ...x, body: "Written offline." } : x)) };
    localStorage.setItem("studio.unsaved.t1", JSON.stringify({ at: new Date().toISOString(), manuscript: local }));
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const banner = await screen.findByRole("alert", { name: "Unsaved changes found on this device" });
    expect(within(banner).getByText(/On this device/).nextSibling?.textContent).toMatch(/^2 words/);
    fireEvent.click(within(banner).getByRole("button", { name: "Restore these changes" }));
    await waitFor(() => expect(f.saved().sections[0].body).toBe("Written offline."), { timeout: 3000 });
    await waitFor(() => expect(screen.queryByRole("alert", { name: "Unsaved changes found on this device" })).toBeNull());
    expect(localStorage.getItem("studio.recovery.t1")).toBeNull();
    expect(localStorage.getItem("studio.unsaved.t1")).toBeNull();
  });

  it("keeps the found copy if restoring fails, and never lets new edits overwrite it", async () => {
    const f = fake();
    const local = { ...f.saved(), sections: f.saved().sections.map((x) => (x.id === "c1" ? { ...x, body: "Written offline." } : x)) };
    localStorage.setItem("studio.unsaved.t1", JSON.stringify({ at: new Date().toISOString(), manuscript: local }));
    (f.backend as unknown as { saveManuscript: () => Promise<never> }).saveManuscript = async () => { throw new Error("The runner is offline."); };
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const banner = await screen.findByRole("alert", { name: "Unsaved changes found on this device" });
    // typing elsewhere first: the found copy is set aside, not overwritten
    fireEvent.change(await screen.findByLabelText("Spirits in the Ancient Near East text"), { target: { value: "A new line." } });
    expect(JSON.parse(localStorage.getItem("studio.recovery.t1")!).manuscript.sections[0].body).toBe("Written offline.");
    fireEvent.click(within(banner).getByRole("button", { name: "Restore these changes" }));
    expect(await within(banner).findByText(/did not accept the restored book/)).toBeTruthy();
    expect(within(banner).getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(localStorage.getItem("studio.recovery.t1")).not.toBeNull();
    expect(screen.getByRole("button", { name: /Not saved: The runner is offline\. Retry/ })).toBeTruthy();
  });

  it("asks before discarding a found copy, and keeps it when the owner cancels", async () => {
    const f = fake();
    const local = { ...f.saved(), sections: f.saved().sections.map((x) => (x.id === "c1" ? { ...x, body: "Written offline." } : x)) };
    localStorage.setItem("studio.unsaved.t1", JSON.stringify({ at: new Date().toISOString(), manuscript: local }));
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const banner = await screen.findByRole("alert", { name: "Unsaved changes found on this device" });
    fireEvent.click(within(banner).getByRole("button", { name: "Discard…" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert", { name: "Unsaved changes found on this device" })).toBeTruthy();
    fireEvent.click(within(banner).getByRole("button", { name: "Discard…" }));
    await waitFor(() => expect(screen.queryByRole("alert", { name: "Unsaved changes found on this device" })).toBeNull());
    expect(localStorage.getItem("studio.recovery.t1")).toBeNull();
    expect(f.saved().sections[0].body).toBe("God's people lived among nations.\n\nThese spirits had names.");
    confirm.mockRestore();
  });

  it("does not report a book the server saved and tidied as unsaved", async () => {
    const f = fake();
    // the same writing, stored differently (extra fields, timestamps, other key order)
    const local = { history: [], sections: f.saved().sections.map((x) => ({ body: x.body, title: x.title, kind: x.kind, id: x.id, pageNotes: [{ page: "3", text: "  " }] })), rules: f.saved().rules, title: f.saved().title, meta: { draft: true } };
    localStorage.setItem("studio.unsaved.t1", JSON.stringify({ at: new Date().toISOString(), manuscript: local }));
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    await screen.findByRole("complementary", { name: "Claude" });
    expect(screen.queryByRole("alert", { name: "Unsaved changes found on this device" })).toBeNull();
    expect(localStorage.getItem("studio.unsaved.t1")).toBeNull();
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

  it("offers both ways to rewrite a new book: chapter by chapter (then Finish merges) or the whole book in one run", async () => {
    const f = fake();
    (f.backend as unknown as { manuscript: () => Promise<null> }).manuscript = async () => null;
    localStorage.setItem("studio.place", "sources");
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const start = await screen.findByRole("region", { name: "Start the book" });
    expect(within(start).getByText(/Finish joins all chapters back into one book/)).toBeTruthy();
    fireEvent.click(within(start).getByRole("button", { name: /Rewrite the whole book/ }));
    expect(await screen.findByRole("dialog", { name: /Rewrite/ })).toBeTruthy();
  });

  it("shows Plan, Write and Finish as their own pages before there is a manuscript, with every way to start, and opens the Book wizard", async () => {
    const f = fake();
    (f.backend as unknown as { manuscript: () => Promise<null> }).manuscript = async () => null;
    localStorage.setItem("studio.place", "plan");
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const plan = await screen.findByRole("region", { name: "Plan the book" });
    expect(within(plan).getByText("No manuscript yet")).toBeTruthy();
    expect(within(plan).getByRole("button", { name: "Rebuild the book" })).toBeTruthy();
    expect(within(plan).getByRole("button", { name: "Split into chapters" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Start the book" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Write/ }));
    expect(await screen.findByRole("region", { name: "Write" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Finish/ }));
    const finish = await screen.findByRole("region", { name: "Finish" });
    fireEvent.click(within(finish).getByRole("button", { name: "Open the Book wizard" }));
    expect(await screen.findByText(/Creation Mode/, {}, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByText(/Restructure/)).toBeTruthy();
  }, 20_000);

  it("keeps what the Studio had before the redesign: Add below, grouped results, and the conversation for a project with no chapters", async () => {
    const f = fake();
    (f.backend as unknown as { manuscript: () => Promise<null> }).manuscript = async () => null;
    const t2 = { ...thread, outputs: [{ path: "rewrite.md", bytes: 10, modifiedAt: "2026-10-27T10:00:00Z" }, { path: "rewrite/01-one.md", bytes: 5, modifiedAt: "2026-10-27T09:00:00Z" }, { path: "sections/c1.md", bytes: 5, modifiedAt: "2026-10-27T09:00:00Z" }], messages: [] } as unknown as StudioThread;
    (f.backend as unknown as { thread: () => Promise<unknown> }).thread = async () => ({ thread: t2, job: null });
    localStorage.setItem("studio.place", "sources");
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /^Results: 3/ }));
    expect(await screen.findByText(/How it works: ask anything/)).toBeTruthy();
    expect(screen.getByLabelText("Message to Claude")).toBeTruthy();
    expect(screen.getByText("Rewritten chapters · 1")).toBeTruthy();
    expect(screen.getByText("Manuscript suggestions · 1")).toBeTruthy();
  });

  it("adds Claude's text below the section's own with Add below", async () => {
    const f = fake();
    render(<MemoryRouter><Workspace {...props(f.backend)} /></MemoryRouter>);
    const panel = await screen.findByRole("complementary", { name: "Claude" });
    fireEvent.click(within(panel).getByRole("button", { name: /Source policy/ }));
    fireEvent.click(within(panel).getByRole("radio", { name: /My book \+ cited sources/ }));
    fireEvent.click(within(panel).getByRole("button", { name: /Rewrite with my idea/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Review the changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Add below" }));
    await waitFor(() => expect(f.saved().sections[0].body).toBe("God's people lived among nations.\n\nThese spirits had names.\n\nYahuah's people lived among many nations.\n\nThese spirits had names."), { timeout: 3000 });
  }, 15_000);
});

