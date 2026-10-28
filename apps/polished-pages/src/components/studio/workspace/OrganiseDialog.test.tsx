import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OrganiseDialog from "./OrganiseDialog";
import { parseOrganise } from "@/lib/organise";

const BOOK = "PREFACE\nThis book was written for the church and its people.\n\nCHAPTER 1\nThe one God is taught in every part of scripture, from the law to the prophets.\n\nCHAPTER 2\nThe name of Jesus is the name above every name, and the apostles baptised in it.";
const PLAN = parseOrganise(JSON.stringify({ sections: [
  { kind: "preface", title: "Preface", starts: "PREFACE This book was written for the church", headings: [] },
  { kind: "chapter", title: "The One God", starts: "CHAPTER 1 The one God is taught in every part", headings: [] },
  { kind: "chapter", title: "The Name", starts: "CHAPTER 2 The name of Jesus is the name", headings: [] },
], notes: "" }));

describe("organise dialog", () => {
  it("organises the manuscript, shows the chapters it found, and applies them only when asked", async () => {
    const organise = vi.fn(async () => PLAN);
    const onApply = vi.fn();
    render(<OrganiseDialog hasManuscript hasUploads readText={async () => BOOK} organise={organise} upload={async () => {}} onApply={onApply} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("radio", { name: /Write clear titles/ }));
    fireEvent.click(screen.getByRole("button", { name: /Organise the book/ }));
    expect(await screen.findByText("The One God")).toBeTruthy();
    expect(organise).toHaveBeenCalledWith(BOOK, { titles: "improve", instructions: undefined });
    expect(screen.getByText(/Chapter 2 ·/)).toBeTruthy();
    expect(screen.getByText(/kept as written/)).toBeTruthy();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Use these chapters" }));
    await waitFor(() => expect(onApply).toHaveBeenCalled());
    expect(onApply.mock.calls[0][0].sections.map((s: { title: string }) => s.title)).toEqual(["Preface", "The One God", "The Name"]);
  });

  it("says when the uploaded book has no text yet", async () => {
    render(<OrganiseDialog hasManuscript={false} hasUploads readText={async () => null} organise={vi.fn()} upload={async () => {}} onApply={() => {}} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Organise the book/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no text yet");
  });
});
