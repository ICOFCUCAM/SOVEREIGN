import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const api = vi.hoisted(() => ({ revise: vi.fn(async (_i: { passage: string; instruction: string; rules?: string }) => "### Introduction\n\nMany Christians do not consciously grasp the reality of Satan."), ask: vi.fn(async () => "It repeats itself in the Introduction.") }));
vi.mock("@/lib/claude-studio", () => ({ claudeReviseInLibrary: api.revise, claudeAskInLibrary: api.ask }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: () => {} }) }));
import LibraryClaude, { bookParts } from "./LibraryClaude";

const MD = "# Demonology I\n\n### Introduction\n\nMany Christians has no conscious understanding of the reality of Satan.\n\n### Chapter One\n\nThe second part.\n";

describe("Claude on a Library book", () => {
  it("splits the book into its headed parts", () => {
    expect(bookParts(MD).map((p) => p.title)).toEqual(["Demonology I", "Introduction", "Chapter One"]);
  });

  it("corrects one part, shows the change, and changes the book only when accepted, with the book's rules", async () => {
    const onChange = vi.fn();
    render(<LibraryClaude docId="d1" title="Demonology I" markdown={MD} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("The part to work on"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Ask Claude/ }));
    await screen.findByRole("button", { name: /Accept into the book/ });
    expect(api.revise.mock.calls[0][0]).toMatchObject({ passage: expect.stringContaining("Many Christians has"), instruction: expect.stringContaining("Correct the English"), rules: expect.stringContaining("Yahusha") });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/On your Claude Code/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Accept into the book/ }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const next = onChange.mock.calls[0][0] as string;
    expect(next).toContain("do not consciously grasp the reality of Satan");
    expect(next).toContain("### Chapter One\n\nThe second part.");
    expect(next.startsWith("# Demonology I\n\n### Introduction")).toBe(true);
  });

  it("answers a question about the book without changing it", async () => {
    const onChange = vi.fn();
    render(<LibraryClaude docId="d1" title="Demonology I" markdown={MD} onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Ask about the book" }));
    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Where does it repeat itself?" } });
    fireEvent.click(screen.getByRole("button", { name: /^Ask$/ }));
    expect(await screen.findByText(/repeats itself in the Introduction/)).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });
});
