import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { BookEngine, ChapterInput } from "@/lib/book-engine";

const draft = {
  bookTitle: "Demonology", genre: "", targetAudience: "", depth: "standard", mode: "improve", existingContent: "", view: "writing",
  outline: { title: "Demonology", chapters: [] }, editedBook: null, meta: {}, coverDone: false, knowledge: { rules: "", terminology: "", forbidden: "" }, knowledgeDocIds: [],
  chapters: [
    { title: "Defining the Subject", summary: "", notes: "", content: "## Defining the Subject\n\nDone.", status: "complete" },
    { title: "Spirits in the Ancient Near East", summary: "", notes: "Start with Mesopotamia", status: "pending" },
  ],
};
vi.mock("@/hooks/use-draft-autosave", () => ({
  readDraft: () => ({ data: draft, docId: null }),
  useDraftAutosave: () => ({ docId: null, status: "idle", flush: async () => null }),
}));
vi.mock("@/lib/knowledge", async (orig) => ({ ...(await orig<object>()), buildGenerationKnowledge: async () => null }));
vi.mock("@/lib/ai-activity-log", () => ({ logAiActivity: () => {} }));

const { default: BookCreator } = await import("./BookCreator");

describe("Book wizard approaches", () => {
  it("lets the owner choose how chapters are written and sends that choice to Claude", async () => {
    const chapter = vi.fn(async (_: ChapterInput) => "## Spirits\n\nText.");
    const engine: BookEngine = { label: "Written by your Claude Code", approaches: true, outline: vi.fn(), chapter, improve: vi.fn(), chapterNotes: async () => "### From your book\n\nPages 4–9" };
    render(<MemoryRouter><BookCreator engine={engine} draftKey="t" /></MemoryRouter>);
    expect((await screen.findByRole("radio", { name: /My book \+ other sources/ })).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: /Polish my book/ }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Generate$/ })[0]);
    await waitFor(() => expect(chapter).toHaveBeenCalled());
    expect(chapter.mock.calls[0][0]).toMatchObject({ chapterIndex: 1, approach: "polish", chapters: [{}, { notes: "Start with Mesopotamia" }] });

    fireEvent.click(screen.getAllByRole("button", { name: /View/ })[0]);
    expect(await screen.findByText("What Claude used for this chapter")).toBeTruthy();
    expect(screen.getByText("Pages 4–9")).toBeTruthy();
  });

  it("offers no approaches on the site's own service, which writes from the outline", async () => {
    const chapter = vi.fn(async (_: ChapterInput) => "x");
    render(<MemoryRouter><BookCreator engine={{ outline: vi.fn(), chapter, improve: vi.fn() }} draftKey="t" /></MemoryRouter>);
    fireEvent.click((await screen.findAllByRole("button", { name: /^Generate$/ }))[0]);
    await waitFor(() => expect(chapter).toHaveBeenCalled());
    expect(screen.queryByRole("radio", { name: /Polish my book/ })).toBeNull();
    expect(chapter.mock.calls[0][0].approach).toBeUndefined();
  });
});
