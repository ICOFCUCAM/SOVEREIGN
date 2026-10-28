import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ActionDialog, setPendingTarget } from "./parts";

// The toasts the viewer shows, so tests can read what the owner is told.
const toasts = vi.hoisted(() => [] as { title?: string; description?: string }[]);
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: (t: { title?: string; description?: string }) => { toasts.push(t); } }) }));
import type { ApprovalSummary, ResultHistory, StudioThread } from "@/lib/claude-studio";
const docs = vi.hoisted(() => ({ save: vi.fn(async (_i: unknown) => "doc-9"), update: vi.fn(async (_id: string, _p: unknown, _pr?: string) => {}) }));
vi.mock("@/lib/documents", () => ({ saveDocument: docs.save, updateDocument: docs.update }));

const thread: StudioThread = { id: "t1", title: "Demonology I", createdAt: "", updatedAt: "", sessionId: null, messages: [],
  files: [{ name: "demonology.pdf", storedAs: "demonology.pdf", kind: "original", bytes: 10, at: "" }],
  outputs: [{ path: "rewrite.md", bytes: 10, modifiedAt: "" }] };

describe("rewrite dialog", () => {
  it("opens as a targeted correction of a result, with the editorial check's problems filled in", () => {
    const onRun = vi.fn();
    setPendingTarget("rewrite.md", { correct: true, instructions: "- FIX: 2 headings share the number 20" });
    render(<ActionDialog action="rewrite" thread={thread} styles={["APA 7"]} onClose={() => {}} onRun={onRun} />);
    expect(screen.getByRole("heading", { name: /Correct the problems/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Problems to fix/)).toHaveValue("- FIX: 2 headings share the number 20");
    fireEvent.click(screen.getByRole("button", { name: /Start the correction/ }));
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ correct: true, target: "rewrite.md", instructions: "- FIX: 2 headings share the number 20" }));
  });

  it("is an ordinary rewrite otherwise, asking for professional re-expression", () => {
    render(<ActionDialog action="rewrite" thread={thread} styles={["APA 7"]} onClose={() => {}} onRun={() => {}} />);
    expect(screen.queryByText(/Correct the problems/)).toBeNull();
    expect(screen.getByLabelText(/Your instructions/).getAttribute("placeholder")).toContain("re-expresses every paragraph professionally");
  });
});

import { ResultViewer } from "./parts";
import type { StudioBackend } from "@/lib/studio-backend";

describe("result viewer", () => {
  const BOOK = "# Demonology I\n\n## The names of the enemy\n\n" + "The enemy bears many names, and each reveals something of his work among people. Satan desired to sift Peter as wheat (Luke 22:31).\n\n".repeat(1) + "This probably refers to individual Christians, tested in their faith by the enemy in every generation of the church and its people across the ages of history.\n\n**20. Sift**\n\nText of the section about sifting, long enough to count as real prose in the book.\n\n**20. Devour**\n\nText of the section about devouring, also long enough to count as prose.\n\n" + "More teaching on the subject of spiritual warfare and the authority of the believer. ".repeat(30);
  const ORIGINAL = "The names of the enemy are many and each one tells us something of his work among men. Satan desired to sift Peter as wheat, Luke 22:31.\n\nI suppose this speaks of individual Christians who are tested in their faith by the enemy in every generation of the church and its people across the ages of history.";
  const backend = fakeBackend(BOOK);

  it("compares the rewrite with the original and puts back the original wording of one paragraph", async () => {
    render(<ResultViewer backend={backend} threadId="t1" path="rewrite.md" projectTitle="Demonology" onClose={() => {}} onUseAsTarget={() => {}} check={{ rules: "", original: async () => ORIGINAL }} />);
    await screen.findByText(/to fix before publishing/);
    fireEvent.click(screen.getAllByRole("button", { name: "Compare with original" })[0]);
    fireEvent.click(await screen.findByRole("radio", { name: "Every paragraph" }));
    const restore = await screen.findAllByRole("button", { name: /Use my original wording/ });
    fireEvent.click(restore[restore.length - 1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Back to the text" })[0]);
    expect(await screen.findByText(/I suppose this speaks of individual Christians/)).toBeInTheDocument();
    expect(screen.getByText(/· edited/)).toBeInTheDocument();
  });

  it("lets the owner change the plan before approving it, saving the change first", async () => {
    const b = fakeBackend("# Plan\n\n1. Chapter one: the names.");
    const approved = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ResultViewer backend={b} threadId="t1" path="rewrite-plan.md" projectTitle="Demonology" onClose={() => {}} onUseAsTarget={() => {}} onApprovePlan={approved} />);
    fireEvent.click(await screen.findByRole("button", { name: /Edit the plan/ }));
    expect(screen.queryByText(/words came back/)).toBeNull(); // a short plan is not a book that failed to read
    fireEvent.change(screen.getByLabelText("Edit the result"), { target: { value: "# Plan\n\n1. Chapter one: the names of the enemy." } });
    fireEvent.click(screen.getByRole("button", { name: /Approve this plan and rewrite the book/ }));
    await waitFor(() => expect(approved).toHaveBeenCalled());
    expect((b as unknown as { saves: { text: string }[] }).saves.at(-1)?.text).toContain("names of the enemy");
    vi.restoreAllMocks();
  });

  it("shows what the checks found before exporting Word, and leads to the check", async () => {
    render(<ResultViewer backend={backend} threadId="t1" path="rewrite.md" projectTitle="Demonology" onClose={() => {}} onUseAsTarget={() => {}} check={{ rules: "", original: async () => ORIGINAL }} />);
    await screen.findByText(/to fix before publishing/);
    const more = screen.getByRole("button", { name: "More actions" });
    fireEvent.keyDown(more, { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: /Export Word/ }));
    const dlg = await screen.findByRole("dialog", { name: /Export Word/ });
    expect(dlg).toHaveTextContent(/The editorial check found \d+ problems? to fix before publishing/);
    expect(dlg).toHaveTextContent(/named as a draft/);
    fireEvent.click(screen.getByRole("button", { name: "See the check" }));
    expect(await screen.findByText(/2 headings share the number 20/)).toBeInTheDocument();
  });

  it("goes from a finding to its passage in the text", async () => {
    render(<ResultViewer backend={backend} threadId="t1" path="rewrite.md" projectTitle="Demonology" onClose={() => {}} onUseAsTarget={() => {}} check={{ rules: "", original: async () => ORIGINAL }} />);
    fireEvent.click(await screen.findByRole("button", { name: "See the check" }));
    const dup = (await screen.findByText(/2 headings share the number 20/)).closest("li")!;
    fireEvent.click(dup.querySelector("summary")!);
    fireEvent.click(screen.getAllByRole("button", { name: "Go to the passage" })[0]);
    const editor = await screen.findByLabelText("Edit the result") as HTMLTextAreaElement;
    await waitFor(() => expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe("**20. Sift**"));
  });
});

/** An in-memory backend with versions, as the runner keeps them. */
function fakeBackend(text: string, opts: { versions?: number } = {}) {
  let cur = text;
  const store: Record<number, string> = {};
  const h: ResultHistory = { path: "rewrite.md", versions: [], approval: null };
  for (let n = 1; n <= (opts.versions ?? 1); n++) { store[n] = n === (opts.versions ?? 1) ? text : `${text}\n\nAn earlier ending ${n}.`; h.versions.push({ n, at: `2026-10-2${n}T10:00:00Z`, op: "Rewrite", bytes: 1, words: 1 }); }
  const saves: { text: string; op: string; base?: number }[] = [];
  const b = {
    output: async () => cur,
    history: async () => structuredClone(h),
    version: async (_i: string, _p: string, n: number) => store[n],
    saveOutput: async (_i: string, _p: string, t: string, o: { op: string; base?: number }) => {
      const latest = h.versions.at(-1)?.n ?? 0;
      if (o.base != null && o.base !== latest) throw new Error(`A newer version (${latest}) was saved after the one you edited (${o.base}).`);
      saves.push({ text: t, ...o }); cur = t; store[latest + 1] = t; h.versions.push({ n: latest + 1, at: new Date().toISOString(), op: o.op, bytes: 1, words: 1 }); return structuredClone(h);
    },
    approve: async (_i: string, _p: string, a: { version: number; summary: ApprovalSummary }) => { h.approval = { version: a.version, at: new Date().toISOString(), by: "owner@example.com", summary: a.summary }; return structuredClone(h); },
  } as unknown as StudioBackend;
  return Object.assign(b, { saves, h, bump: () => { h.versions.push({ n: h.versions.length + 1, at: new Date().toISOString(), op: "Rewrite", bytes: 1, words: 1 }); } });
}

describe("versions and approval of a rewritten book", () => {
  const CLEAN = "# Demonology I\n\n## One\n\n" + "The believer stands firm in faith and prayer against the schemes of the enemy. ".repeat(40) + "\n\n## References\n\nKing James Bible (1611). London: Robert Barker.\n";
  const open = (b: StudioBackend, extra: Partial<Parameters<typeof ResultViewer>[0]> = {}) => render(<ResultViewer backend={b} threadId="t1" path="rewrite.md" projectTitle="Demonology" onClose={() => {}} onUseAsTarget={() => {}} {...extra} />);

  it("shows the version and its status, saves edits as a new version, and restores an earlier one as another", async () => {
    const b = fakeBackend(CLEAN, { versions: 2 });
    open(b);
    expect(await screen.findByRole("status", { name: "Review status" })).toHaveTextContent("Draft · version 2 of 2");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Edit the result"), { target: { value: CLEAN + "\nA new closing line." } });
    expect(screen.getByRole("status", { name: "Review status" })).toHaveTextContent("Edited, not saved as a version");
    expect(screen.getByRole("button", { name: /Save draft to Library/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Save as version 3" }));
    await waitFor(() => expect(b.saves[0]).toMatchObject({ op: "Edited by the owner", base: 2 }));
    expect(await screen.findByRole("status", { name: "Review status" })).toHaveTextContent("Draft · version 3 of 3");
    fireEvent.click(screen.getByRole("button", { name: "Versions (3)" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[1]); // version 1
    fireEvent.click(await screen.findByRole("button", { name: /Restore as a new version/ }));
    await waitFor(() => expect(b.saves[1]).toMatchObject({ op: "Restored version 1", base: 3 }));
    expect(b.saves[1].text).toContain("An earlier ending 1.");
  });

  it("refuses to save over a version saved elsewhere since, and says so", async () => {
    const b = fakeBackend(CLEAN);
    open(b);
    await screen.findByRole("status", { name: "Review status" });
    b.bump(); // another device saved version 2
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Edit the result"), { target: { value: CLEAN + "\nMine." } });
    fireEvent.click(screen.getByRole("button", { name: "Save as version 2" }));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ title: "Not saved", description: expect.stringContaining("A newer version (2) was saved after the one you edited (1)") }));
    expect(b.saves).toHaveLength(0);
    expect(screen.getByRole("status", { name: "Review status" })).toHaveTextContent("Edited, not saved as a version");
  });

  it("approves only when nothing blocks and every decision is made, then records it on that version", async () => {
    const blocked = fakeBackend(CLEAN.replace("stands firm", "stands firm [citation needed]"));
    const { unmount } = open(blocked);
    fireEvent.click(await screen.findByRole("button", { name: /Approve for publication/ }));
    expect(await screen.findByText(/problem blocks publishing/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve version 1" })).toBeDisabled();
    unmount();

    const b = fakeBackend(CLEAN.replace("## One", "## One\n\nIn a dream I saw the believers stand."), {});
    open(b, { onReview: () => {} });
    fireEvent.click(await screen.findByRole("button", { name: /Approve for publication/ }));
    // nothing blocks; no review items here; the judgement review is offered, not required
    expect(await screen.findByText(/No AI editorial review for this version yet/)).toBeInTheDocument();
    const approve = screen.getByRole("button", { name: "Approve version 1" });
    await waitFor(() => expect(approve).toBeEnabled());
    fireEvent.click(approve);
    expect(await screen.findByRole("status", { name: "Review status" })).toHaveTextContent(/Approved for publication · version 1 · owner@example.com/);
    expect(b.h.approval?.summary).toMatchObject({ blockers: 0, aiReview: false });
    expect(screen.getByRole("button", { name: /Save to Library \(approved\)/ })).toBeInTheDocument();
  });

  it("asks for each review item to be decided before approval", async () => {
    const b = fakeBackend(CLEAN.replace("## One", "## One\n\nThe Holy Ghost and the Holy Spirit are both named here."));
    open(b);
    fireEvent.click(await screen.findByRole("button", { name: /Approve for publication/ }));
    const approve = await screen.findByRole("button", { name: "Approve version 1" });
    expect(approve).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Both “Holy Ghost”/ }));
    expect(approve).toBeEnabled();
  });

  it("offers Word and EPUB export, named as a draft until approved, and the judgement review", async () => {
    const onReview = vi.fn();
    const b = fakeBackend(CLEAN);
    open(b, { onReview });
    await screen.findByRole("status", { name: "Review status" });
    const more = screen.getByRole("button", { name: "More actions" });
    more.focus(); fireEvent.keyDown(more, { key: "Enter" });
    expect(await screen.findByText("Export Word (.docx)")).toBeInTheDocument();
    expect(screen.getByText("Export EPUB")).toBeInTheDocument();
    expect(screen.getByText(/Exports are named “draft” until this version is approved/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Editorial review by Claude (judgement)"));
    expect(onReview).toHaveBeenCalledWith("rewrite.md");
  });
});

import { resultStatus } from "./ResultVersions";
describe("review status", () => {
  const v = (n: number) => ({ n, at: "2026-10-27T10:00:00Z", op: "Rewrite", bytes: 1, words: 1 });
  it("shows an approval as lapsed once a newer version exists", () => {
    const approval = { version: 1, at: "2026-10-27T11:00:00Z", by: "owner@example.com", summary: { blockers: 0, reviews: 0, decided: 0, checks: [] } };
    expect(resultStatus({ path: "rewrite.md", versions: [v(1)], approval }, false).tone).toBe("approved");
    expect(resultStatus({ path: "rewrite.md", versions: [v(1), v(2)], approval }, false)).toEqual({ tone: "lapsed", label: "Draft · version 2 (the approval was for version 1)" });
    expect(resultStatus({ path: "rewrite.md", versions: [v(1)], approval }, true).tone).toBe("unsaved");
  });
});

describe("result viewer and the Library", () => {
  it("saves a result to the Library linked to its project, and a second save updates the same book", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    localStorage.clear();
    const backend = fakeBackend("# Demonology I\n\n## One\n\n" + "Proofread text of the book, long enough to be a real chapter of prose. ".repeat(40));
    const { unmount } = render(<MemoryRouter><ResultViewer backend={backend} threadId="t1" path="proofread.md" projectTitle="Demonology" onClose={() => {}} onUseAsTarget={() => {}} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Save to Library as a book/ }));
    await waitFor(() => expect(docs.save).toHaveBeenCalledTimes(1));
    expect(docs.save.mock.calls[0][0]).toMatchObject({ kind: "book", payload: expect.objectContaining({ studioProject: "t1" }) });
    unmount();
    render(<MemoryRouter><ResultViewer backend={backend} threadId="t1" path="proofread.md" projectTitle="Demonology" onClose={() => {}} onUseAsTarget={() => {}} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Update in Library/ }));
    await waitFor(() => expect(docs.update).toHaveBeenCalledWith("doc-9", expect.objectContaining({ studioProject: "t1" }), expect.any(String)));
    expect(docs.save).toHaveBeenCalledTimes(1);
  });
});

