import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: () => {} }) }));
import { ActionDialog } from "./parts";
import type { StudioThread } from "@/lib/claude-studio";

const thread = { id: "t9", title: "Demonology", files: [{ name: "d.docx", storedAs: "d.docx", kind: "original", bytes: 1, at: "" }], outputs: [], messages: [] } as unknown as StudioThread;
beforeEach(() => { localStorage.clear(); vi.spyOn(window, "confirm").mockReturnValue(true); });

describe("the control panel in the Rewrite dialog", () => {
  it("builds the instructions from presets and checkboxes, and starts the rewrite in approval mode", () => {
    const onRun = vi.fn();
    render(<ActionDialog action="rewrite" thread={thread} styles={["APA 7"]} rules="Write Yahusha instead of Jesus" onClose={() => {}} onRun={onRun} />);
    fireEvent.click(screen.getByRole("button", { name: /Open the control panel/ }));
    const panel = screen.getByRole("dialog", { name: /Book Rewrite Control Panel/ });
    expect(within(panel).getByLabelText(/Book title/)).toHaveValue("Demonology");
    fireEvent.click(within(panel).getByRole("button", { name: "Complete Book Transformation" }));
    expect(within(panel).getByText(/Complete Book Transformation · \d+ of 108 operations/)).toBeTruthy();
    fireEvent.click(within(panel).getByRole("button", { name: /E\. Content reduction/ }));
    fireEvent.click(within(panel).getByLabelText(/Remove irrelevant material/));
    expect(within(panel).getByText(/\(changed by hand\)/)).toBeTruthy();
    const preview = within(panel).getByLabelText("Preview of the instruction");
    expect(preview.textContent).not.toContain("Remove irrelevant material");
    expect(preview.textContent).toContain("Write Yahusha instead of Jesus");
    fireEvent.click(within(panel).getByRole("button", { name: /Use this instruction/ }));
    expect((screen.getByLabelText(/Your instructions/) as HTMLTextAreaElement).value).toContain("# Book rewrite: Demonology");
    expect(screen.getByText(/Approval mode: Claude analyses the book/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Start rewrite/ }));
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ approval: true, auditOnly: false, keepStructure: false, target: "source" }));
  });

  it("uses the owner's Demonology instruction word for word", () => {
    const onRun = vi.fn();
    render(<ActionDialog action="rewrite" thread={thread} styles={["APA 7"]} onClose={() => {}} onRun={onRun} />);
    fireEvent.click(screen.getByRole("button", { name: /Open the control panel/ }));
    const panel = screen.getByRole("dialog", { name: /Book Rewrite Control Panel/ });
    fireEvent.click(within(panel).getByRole("checkbox", { name: /Demonology: The Battle of Angels” instruction, word for word/ }));
    fireEvent.click(within(panel).getByRole("button", { name: /Use this instruction/ }));
    expect((screen.getByLabelText(/Your instructions/) as HTMLTextAreaElement).value.startsWith("COMPLETE BOOK TRANSFORMATION — DEMONOLOGY")).toBe(true);
  });
});
