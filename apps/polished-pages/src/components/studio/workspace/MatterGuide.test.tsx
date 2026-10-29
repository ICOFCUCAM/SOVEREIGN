import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import type { Manuscript } from "@/lib/manuscript";
import MatterGuide from "./MatterGuide";

const book: Manuscript = { title: "The Oneness of Yahuah", author: "A. Author", history: [], sections: [
  { id: "i", kind: "introduction", title: "Introduction", body: "This book sets out what the scriptures teach." },
  { id: "c", kind: "chapter", title: "One Yahuah", body: "Both testaments confess that Yahuah is one." },
] };

function Harness({ rewrite, start, onChange }: { rewrite: (i: { notes: string }) => Promise<string>; start?: string; onChange: (m: Manuscript) => void }) {
  const [m, setM] = useState(book);
  return <MatterGuide m={m} onUpdate={(n) => { setM(n); onChange(n); }} rewrite={rewrite as never} start={start} onClose={() => {}} />;
}

describe("front and back matter, page by page", () => {
  it("rewrites the author's words, can rewrite again, and accepting sets the page and goes on to the next", async () => {
    const rewrite = vi.fn().mockResolvedValueOnce("To my wife, [[YOURS: her name]].").mockResolvedValueOnce("To my wife Ann, with love.");
    const changes: Manuscript[] = [];
    render(<Harness rewrite={rewrite} start="dedication" onChange={(m) => changes.push(m)} />);
    fireEvent.change(screen.getByLabelText(/Your words for the Dedication/), { target: { value: "to my wife ann" } });
    fireEvent.click(screen.getByRole("button", { name: /Rewrite it professionally/ }));
    await screen.findByText(/For you to fill in/);
    expect(rewrite.mock.calls[0][0]).toMatchObject({ kind: "dedication", notes: "to my wife ann", fromBook: false });
    fireEvent.click(screen.getByRole("button", { name: /Rewrite again/ }));
    await waitFor(() => expect((screen.getByLabelText("Claude's version") as HTMLTextAreaElement).value).toBe("To my wife Ann, with love."));
    fireEvent.click(screen.getByRole("button", { name: /Accept and go to the next page/ }));
    expect(changes.at(-1)!.sections.find((s) => s.kind === "dedication")?.body).toBe("To my wife Ann, with love.");
    expect(screen.getByRole("heading", { name: "Epigraph" })).toBeTruthy();
  });
  it("shows a page the manuscript already has, to edit by hand or with Claude, and can leave a page out", () => {
    const changes: Manuscript[] = [];
    render(<Harness rewrite={vi.fn()} start="introduction" onChange={(m) => changes.push(m)} />);
    expect(screen.getByText("This book sets out what the scriptures teach.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Edit it myself/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Improve it with Claude/ })).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Include this page in the book/));
    expect(changes.at(-1)!.sections.find((s) => s.kind === "introduction")).toMatchObject({ omit: true, body: "This book sets out what the scriptures teach." });
  });
  it("asks for the copyright facts in fields and never makes them up", () => {
    const changes: Manuscript[] = [];
    render(<Harness rewrite={vi.fn()} start="copyright" onChange={(m) => changes.push(m)} />);
    fireEvent.change(screen.getByLabelText(/ISBN/), { target: { value: "978-1-23456-789-0" } });
    expect(changes.at(-1)!.meta?.isbn).toBe("978-1-23456-789-0");
    expect(screen.getByText(/never filled with a guess/)).toBeTruthy();
  });
});
