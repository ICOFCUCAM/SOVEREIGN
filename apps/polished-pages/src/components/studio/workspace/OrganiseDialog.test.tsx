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

  it("lets the owner correct the division before applying it: rename, change the kind, join to the part before", async () => {
    const onApply = vi.fn();
    render(<OrganiseDialog hasManuscript hasUploads readText={async () => BOOK} organise={async () => PLAN} upload={async () => {}} onApply={onApply} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Organise the book/ }));
    fireEvent.change(await screen.findByLabelText("Title of part 2"), { target: { value: "One God" } });
    fireEvent.change(screen.getByLabelText("Kind of part 1"), { target: { value: "introduction" } });
    fireEvent.click(screen.getByRole("button", { name: "Join part 3 to the part before" }));
    fireEvent.click(screen.getByRole("button", { name: "Use these chapters" }));
    const parts = onApply.mock.calls[0][0].sections as { kind: string; title: string; body: string }[];
    expect(parts.map((s) => [s.kind, s.title])).toEqual([["introduction", "Preface"], ["chapter", "One God"]]);
    expect(parts[1].body).toMatch(/every part of scripture[\s\S]*### The Name[\s\S]*apostles baptised in it/);
  });

  it("says when the uploaded book has no text yet", async () => {
    render(<OrganiseDialog hasManuscript={false} hasUploads readText={async () => null} organise={vi.fn()} upload={async () => {}} onApply={() => {}} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Organise the book/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no text yet");
  });

  it("organises the manuscript again from the version before the last organising, from the book's own contents", async () => {
    const readText = vi.fn(async () => "Contents\nIntroduction\n1. One Yahuah\n2. The Nature of Yahuah\nIntroduction\nThis book sets out what the scriptures teach about the one Yahuah, chapter by chapter, in order.\n1. One Yahuah\nBoth testaments confess that Yahuah is one, and the Shema stands at the centre of that confession.\n2. The Nature of Yahuah\nYahuah is spirit, eternal and holy; he does not change, and his word stands for ever and ever.");
    const organise = vi.fn();
    render(<OrganiseDialog hasManuscript hasUploads={false} hasEarlier readText={readText} organise={organise} upload={async () => {}} onApply={() => {}} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("radio", { name: /As it was before the last organising/ }));
    fireEvent.click(screen.getByRole("button", { name: /Organise the book/ }));
    expect(await screen.findByText(/Arranged from the book's own contents list/)).toBeTruthy();
    expect(readText).toHaveBeenCalledWith("earlier");
    expect(organise).not.toHaveBeenCalled();
    expect(screen.getByText(/Chapter 2 ·/)).toBeTruthy();
  });
});
