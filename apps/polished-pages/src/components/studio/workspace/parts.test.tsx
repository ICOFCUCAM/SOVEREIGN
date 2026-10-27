import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ActionDialog, setPendingTarget } from "./parts";
import type { StudioThread } from "@/lib/claude-studio";

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
  const backend = { output: async () => BOOK } as unknown as StudioBackend;

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
