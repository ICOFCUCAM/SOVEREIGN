import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BookDesignDialog from "./BookDesignDialog";
import type { BookDesign } from "@/lib/book-design";

const DESIGN: BookDesign = {
  title: "Demonology I", subtitle: "A course in spiritual warfare", reader: "Bible-school students", rationale: "From foundations to practice.",
  sections: [
    { kind: "introduction", title: "Introduction", summary: "How to use the book.", keyPoints: [], draws: "Preface", apparatus: "" },
    { kind: "part", title: "Part One: Foundations", summary: "", keyPoints: [], draws: "", apparatus: "" },
    { kind: "chapter", title: "The reality of the unseen", summary: "Why it matters.", keyPoints: [], draws: "Introduction; ch. 3", apparatus: "Learning outcomes, review questions" },
  ],
  unplaced: [{ what: "A repeated list of names", where: "p. 40", why: "Already in chapter 2" }],
  missing: ["The course schedule"],
};

describe("rebuild as a professional book", () => {
  it("takes the owner's instructions, shows Claude's design with what is not placed, and applies it only when asked", async () => {
    const design = vi.fn(async () => DESIGN);
    const onApply = vi.fn();
    render(<BookDesignDialog sections={7} design={design} onClose={() => {}} onApply={onApply} />);
    // "My instructions only" needs instructions.
    fireEvent.click(screen.getByRole("radio", { name: /My instructions only/ }));
    expect(screen.getByRole("button", { name: /Design the book/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Your instructions for the book/), { target: { value: "A twelve-week university course in three parts." } });
    fireEvent.click(screen.getByRole("radio", { name: /My book \+ cited sources/ }));
    fireEvent.click(screen.getByRole("button", { name: /Design the book/ }));
    await waitFor(() => expect(screen.getByText("The reality of the unseen")).toBeInTheDocument());
    expect(design).toHaveBeenCalledWith({ bookType: "custom", instructions: "A twelve-week university course in three parts.", approach: "mine-and-research" });
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText(/Not placed in the new book \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/A repeated list of names/)).toBeInTheDocument();
    expect(screen.getByText(/Missing: for you to supply/)).toBeInTheDocument();
    expect(screen.getByText(/manuscript's 7 sections are replaced by the 3 designed ones/)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Use this design/ }));
    expect(onApply).toHaveBeenCalledWith(DESIGN, expect.objectContaining({ bookType: "custom", approach: "mine-and-research" }));
  });

  it("says plainly when Claude couldn't design the book", async () => {
    render(<BookDesignDialog sections={0} design={async () => { throw new Error("Claude's design has no chapters. Try again."); }} onClose={() => {}} onApply={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Design the book/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no chapters");
  });
});
