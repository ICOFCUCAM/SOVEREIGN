import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ManuscriptEditor from "./ManuscriptEditor";
import type { Manuscript } from "@/lib/manuscript";
import type { RunOptions, StudioThread } from "@/lib/claude-studio";
import type { StudioBackend } from "@/lib/studio-backend";

vi.mock("@/lib/documents", () => ({ saveDocument: vi.fn(), setTags: vi.fn() }));

const thread = { id: "t1", title: "Demonology", files: [] } as unknown as StudioThread;

function fakeBackend() {
  let saved: Manuscript = { title: "Demonology", sections: [
    { id: "c1", kind: "chapter", title: "Origins", body: "God made all things." },
    { id: "c2", kind: "chapter", title: "Spirits", body: "Jesus cast them out." },
  ], history: [] };
  const runs: RunOptions[] = [];
  const outputs: Record<string, string> = { "sections/c1-summary.md": "It teaches that all things were made.", "sections/c1.md": "### Creation\n\nYahuah made all things." };
  const backend = {
    storage: "browser",
    manuscript: async () => saved,
    saveManuscript: async (_: string, m: Manuscript) => { saved = m; return m; },
    run: async (_id: string, _a: string, o: RunOptions) => { runs.push(o); return { id: `j${runs.length}` }; },
    follow: async (_j: unknown, on: (e: unknown) => void) => { on({ type: "done", status: "done" }); },
    output: async (_id: string, p: string) => outputs[p],
    cancel: async () => {}, source: async () => null,
  } as unknown as StudioBackend;
  return { backend, runs, saved: () => saved };
}

describe("guided rewrite", () => {
  it("shows what the chapter says, rewrites with the owner's idea and the book's rules, and keeps the original", async () => {
    const f = fakeBackend();
    render(<MemoryRouter><ManuscriptEditor thread={thread} backend={f.backend} engine="claude-code" citationStyles={["APA 7"]} onChanged={() => {}} /></MemoryRouter>);
    fireEvent.change(await screen.findByLabelText("Rules for the whole book"), { target: { value: "Write Yahuah instead of God" } });

    fireEvent.click(screen.getByRole("button", { name: /Read this chapter/ }));
    expect(await screen.findByText("It teaches that all things were made.")).toBeTruthy();
    expect(f.runs[0]).toMatchObject({ sectionId: "c1", op: "explain" });

    fireEvent.change(screen.getByLabelText("Your idea for this chapter"), { target: { value: "Open with creation" } });
    fireEvent.click(screen.getByRole("button", { name: /Rewrite with my idea/ }));
    await screen.findByText(/Claude's suggestion/);
    expect(f.runs[1]).toMatchObject({ sectionId: "c1", op: "rewrite", idea: "Open with creation", rules: "Write Yahuah instead of God" });

    // edit the suggestion before using it
    fireEvent.click(screen.getByRole("button", { name: /Edit first/ }));
    fireEvent.change(screen.getByLabelText("Edit Claude's suggestion"), { target: { value: "### Creation\n\nYahuah made all things, seen and unseen." } });
    fireEvent.click(screen.getByRole("button", { name: /Use it/ }));
    await waitFor(() => expect(screen.getByText(/1 of 2 chapters rewritten/)).toBeTruthy());
    expect((screen.getByLabelText("Origins text") as HTMLTextAreaElement).value).toBe("### Creation\n\nYahuah made all things, seen and unseen.");

    fireEvent.click(screen.getByRole("button", { name: /Next chapter/ }));
    expect((await screen.findByLabelText("Spirits text") as HTMLTextAreaElement).value).toBe("Jesus cast them out.");
    fireEvent.click(screen.getByRole("button", { name: /Rewrite with my idea/ }));
    await waitFor(() => expect(f.saved().sections[0]).toMatchObject({ original: "God made all things.", idea: "Open with creation", summary: "It teaches that all things were made." }));
    expect(f.saved().rules).toBe("Write Yahuah instead of God");
  });
});
