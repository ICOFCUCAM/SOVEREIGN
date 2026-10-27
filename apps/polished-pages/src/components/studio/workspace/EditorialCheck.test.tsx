import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import EditorialCheck, { SuggestionChecks } from "./EditorialCheck";

const REWRITE = `# Demonology I

## 20. Sift

Satan desired to sift Peter as wheat (Luke 22:31). This speaks of individual Christians who are tested [citation needed].

## 20. Devour

The adversary walks about seeking whom he may devour (1 Peter 5:8). The spirits clearly come from a former creation.
`;
const ORIGINAL = "Satan desired to sift Peter as wheat, Luke 22:31. I suppose this speaks of individual Christians who are tested. Perhaps the spirits come from a former creation. Read 1 Peter 5:8 and Ephesians 6:12.";

describe("editorial check on screen", () => {
  it("shows what blocks publishing and how the rewrite compares with the original", async () => {
    const original = vi.fn(async () => ORIGINAL);
    const onPlace = vi.fn();
    render(<EditorialCheck text={REWRITE} original={original} onPlace={onPlace} placeLabel="Open the section" />);
    await waitFor(() => expect(screen.getByText(/Scripture references kept: 2 of 3/)).toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent(/to fix before publishing/);
    expect(screen.getByText(/2 headings share the number 20/)).toBeInTheDocument();
    expect(screen.getByText(/editorial marker is still in the text/)).toBeInTheDocument();
    expect(screen.getByText(/scripture reference from the original is missing from the rewrite: Ephesians 6:12/)).toBeInTheDocument();
    expect(screen.getByText(/lost their qualification|lost its qualification/)).toBeInTheDocument();
    // a place opens the section it belongs to
    fireEvent.click(screen.getAllByText(/^Where/)[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Open the section" })[0]);
    expect(onPlace).toHaveBeenCalledWith(expect.objectContaining({ line: expect.any(Number) }));
  });

  it("corrects only the selected findings, each with its suggested correction", async () => {
    const onCorrect = vi.fn();
    render(<EditorialCheck text={REWRITE} onCorrect={onCorrect} />);
    const dup = screen.getByText(/2 headings share the number 20/).closest("li")!;
    expect(within(dup).getByText(/Suggested:/).parentElement).toHaveTextContent(/Renumber so each number is used once/);
    expect(within(dup).getByText("S1")).toBeInTheDocument();
    // leave the duplicate numbering out of this correction
    fireEvent.click(within(dup).getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Correct \d+ selected with Claude/ }));
    const brief = onCorrect.mock.calls[0][0] as string;
    expect(brief).not.toContain("share the number 20");
    expect(brief).toContain("editorial marker");
    expect(brief).toContain("Suggested correction: Find a source");
  });

  it("lets the author dismiss a review item, never a blocker, and remembers it", () => {
    localStorage.clear();
    const BOOK = `${REWRITE}\nThe Holy Ghost and the Holy Spirit are both named here.\n`;
    const { unmount } = render(<EditorialCheck text={BOOK} storageKey="k1" />);
    const cert = screen.getByText(/Both “Holy Ghost”/).closest("li")!;
    fireEvent.click(within(cert).getByRole("button", { name: "Dismiss" }));
    expect(within(cert).getByText("Dismissed")).toBeInTheDocument();
    const dup = screen.getByText(/2 headings share the number 20/).closest("li")!;
    expect(within(dup).queryByRole("button", { name: "Dismiss" })).toBeNull();
    unmount();
    render(<EditorialCheck text={BOOK} storageKey="k1" />);
    expect(within(screen.getByText(/Both “Holy Ghost”/).closest("li")!).getByText("Dismissed")).toBeInTheDocument();
  });

  it("says which checks ran, and never shows a check that did not run as passed", async () => {
    render(<EditorialCheck text={REWRITE} original={async () => ""} />);
    await waitFor(() => expect(screen.getAllByText(/No readable original/).length).toBeGreaterThan(0));
    fireEvent.click(screen.getByText(/What was checked/));
    const fidelity = screen.getByText("Faithfulness to the original", { selector: "strong" }).closest("li")!;
    expect(fidelity).toHaveTextContent(/^Not run/);
    const structure = screen.getByText("Structure and numbering", { selector: "strong" }).closest("li")!;
    expect(structure).toHaveTextContent(/found/);
  });

  it("says plainly what the checks cannot judge when they find nothing", () => {
    render(<EditorialCheck text={"# A book\n\n## One\n\nThe first chapter has text.\n"} />);
    expect(screen.getByRole("status")).toHaveTextContent("No blocking problems found by the code checks");
    expect(screen.getByText(/Judgement-level review \(arguments, teaching\) is still yours/)).toBeInTheDocument();
  });

  it("checks one section's suggestion against the author's text before it is accepted", () => {
    const { rerender } = render(<SuggestionChecks before="I suppose this speaks of individual Christians who are tested, as Luke 22:31 shows." after="This speaks of individual Christians who are tested [citation needed]." rewrite />);
    expect(screen.getByText(/points? before you accept/)).toBeInTheDocument();
    expect(screen.getByText(/is missing from the rewrite: Luke 22:31/)).toBeInTheDocument();
    expect(screen.getByText(/editorial marker/)).toBeInTheDocument();
    rerender(<SuggestionChecks before="I suppose this speaks of individual Christians, Luke 22:31." after="This probably refers to individual Christians (Luke 22:31)." rewrite />);
    expect(screen.getByText(/qualifications kept; nothing unfinished added/)).toBeInTheDocument();
  });
});
