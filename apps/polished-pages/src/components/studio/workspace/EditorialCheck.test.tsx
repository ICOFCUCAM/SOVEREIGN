import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("starts a targeted correction with the findings filled in", async () => {
    const onCorrect = vi.fn();
    render(<EditorialCheck text={REWRITE} onCorrect={onCorrect} />);
    fireEvent.click(screen.getByRole("button", { name: /Correct these with Claude/ }));
    expect(onCorrect.mock.calls[0][0]).toContain("FIX: 2 headings share the number 20");
  });

  it("says when there is no original to compare", async () => {
    render(<EditorialCheck text={REWRITE} original={async () => ""} />);
    await waitFor(() => expect(screen.getByText(/No readable original/)).toBeInTheDocument());
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
