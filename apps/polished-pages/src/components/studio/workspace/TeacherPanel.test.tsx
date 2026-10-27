import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { Manuscript } from "@/lib/manuscript";

const calls: string[] = [];
vi.mock("@/lib/teacher/client", async (orig) => {
  const real = await orig<typeof import("@/lib/teacher/client")>();
  let indexed = false;
  return {
    ...real,
    courseFor: vi.fn(async () => (indexed ? "11111111-1111-1111-1111-111111111111" : null)),
    courseContext: vi.fn(async () => ({ id: "c", title: "Demonology", rules: [], sources: [{ title: "Demonology", author: null, role: "required", version_id: "v", embedded: 2, passages: 2 }] })),
    usageSummary: vi.fn(async () => (indexed ? { settings: { ai_answers: false, vector_search: false, monthly_request_cap: 500, monthly_token_cap: 2000000, per_minute: 8, per_day: 150 }, requests: 0, by_path: {}, model_calls: [] } : null)),
    saveSettings: vi.fn(async () => ({})),
    indexBook: vi.fn(async (o: { onProgress: (p: unknown) => void }) => { calls.push("index"); o.onProgress({ step: "done" }); indexed = true; return { courseId: "c", versionId: "v", embeddingsReady: true }; }),
    ask: vi.fn(async (o: { question: string }) => { calls.push(`ask:${o.question}`); if (o.question.startsWith("Book:")) return {
      status: "evidence", answered_by: "book", answer: "Here is what Demonology says about this, from Chapter 1.", notice: null, limitations: [], check_question: null, claims: [], citations: [],
      passages: [{ evidence_id: "doc-1:ch-01:aaa", source_title: "Demonology", source_location: "Chapter 1 ¶1", chapter_id: "ch-01", text: "The people of the ancient world did not doubt that spirits were real." }],
      retrieval: { candidates: 3, evidence: 1, vector: false }, validation: { ok: true, repaired: false }, request_id: "r" };
      return {
      status: "answered", answer: "The author says the ancient world took spirits as real.", limitations: [], check_question: null,
      claims: [{ text: "Ancient peoples did not doubt spirits were real.", evidence: [{ evidence_id: "doc-1:ch-01:aaa", source_title: "Demonology", source_location: "Chapter 1 ¶1" }] }],
      citations: [{ evidence_id: "doc-1:ch-01:aaa", quote: "did not doubt that spirits were real", source_title: "Demonology", source_location: "Chapter 1 ¶1" }],
      evidence: [{ evidence_id: "doc-1:ch-01:aaa", source_title: "Demonology", source_location: "Chapter 1 ¶1", text: "The people of the ancient world did not doubt that spirits were real." }],
      retrieval: { candidates: 3, evidence: 1, vector: true }, validation: { ok: true, repaired: false, citations_verified: 1 }, request_id: "r" }; }),
  };
});
import TeacherPanel from "./TeacherPanel";

const m: Manuscript = { title: "Demonology", libraryId: "doc-1", history: [], rules: "Write Yahuah instead of God", sections: [
  { id: "c1", kind: "chapter", title: "Spirits in the Ancient Near East", body: "The people of the ancient world did not doubt that spirits were real." },
] };

describe("AI Teacher panel", () => {
  it("previews the chapters, indexes only on confirmation, then answers with its evidence", async () => {
    render(<TeacherPanel m={m} ensureSaved={async () => "doc-1"} />);
    expect(screen.getByText(/Index the book first/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Check the chapters/ }));
    const table = await screen.findByRole("table", { name: "Chapters as the tutor will read them" });
    expect(within(table).getByText("Spirits in the Ancient Near East")).toBeTruthy();
    expect(calls).toEqual([]); // nothing indexed yet
    fireEvent.click(screen.getByRole("button", { name: /These chapters are right/ }));
    await waitFor(() => expect(calls).toEqual(["index"]));
    fireEvent.change(await screen.findByLabelText("Question"), { target: { value: "What did the ancient world believe?" } });
    fireEvent.click(screen.getByRole("button", { name: /^Ask$/ }));
    const ans = await screen.findByRole("article", { name: "The tutor's answer" });
    expect(within(ans).getByText("Answered from the book")).toBeTruthy();
    fireEvent.click(within(ans).getByRole("button", { name: "Chapter 1 ¶1" }));
    expect(within(ans).getAllByText(/did not doubt that spirits were real/).length).toBeGreaterThan(1);
    expect(within(ans).getByText(/1 quotation verified, evidence from 1 passage/)).toBeTruthy();
  });

  it("answers from the book by default, with no AI, and says so", async () => {
    render(<TeacherPanel m={m} ensureSaved={async () => "doc-1"} />);
    const mode = await screen.findByRole("region", { name: "How the tutor answers" });
    expect(within(mode).getByRole("switch", { name: "AI explanations" }).getAttribute("aria-checked")).toBe("false");
    expect(within(mode).getByText(/no paid calls/)).toBeTruthy();
    expect(screen.getByText("Answers come from the book: no AI cost.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: "Book: what did they believe?" } });
    fireEvent.click(screen.getByRole("button", { name: /^Ask$/ }));
    const ans = await screen.findByRole("article", { name: "The tutor's answer" });
    expect(within(ans).getByText("From the book's own words")).toBeTruthy();
    expect(within(ans).getByRole("list", { name: "Passages from the book" }).textContent).toMatch(/did not doubt that spirits were real/);
    expect(within(ans).getByText(/no AI used/)).toBeTruthy();
  });
});
