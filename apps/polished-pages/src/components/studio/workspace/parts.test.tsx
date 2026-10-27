import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
