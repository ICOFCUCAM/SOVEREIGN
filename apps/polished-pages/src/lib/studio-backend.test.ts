import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ authHeader: async () => "Bearer test" }));
vi.mock("@/lib/extract-file-text", () => ({ extractFileText: async () => "" }));
vi.mock("@/lib/claude-studio", async () => ({ RUNNER_URL: "https://runner.example", followJob: vi.fn(), studio: {}, uploadToStudio: vi.fn() }));

import { decideEngine, followApiJob, startApiRun } from "./studio-backend";
import type { StudioEvent, StudioMe, StudioThread } from "./claude-studio";

const me = (state: string, extra: Record<string, unknown> = {}) => ({ user: { id: "u", email: null }, claudeConnected: true, claude: { state, at: null, resetsAt: null, message: null, ...extra }, busy: null, citationStyles: [] }) as unknown as StudioMe;

describe("decideEngine", () => {
  it("prefers Claude Code in Auto and says so", () => {
    expect(decideEngine("auto", me("ok"), null)).toMatchObject({ active: "claude-code", tone: "ok" });
    expect(decideEngine("auto", me("unknown"), null).active).toBe("claude-code");
  });
  it("switches to the API in Auto when Claude Code is signed out, at its limit, or the runner is down", () => {
    expect(decideEngine("auto", me("signed_out"), null)).toMatchObject({ active: "api", reason: expect.stringMatching(/signed out/) });
    expect(decideEngine("auto", me("limit", { resetsAt: new Date(Date.now() + 3600e3).toISOString() }), null).reason).toMatch(/limit is reached until/);
    expect(decideEngine("auto", null, "offline")).toMatchObject({ active: "api", reason: expect.stringMatching(/can't be reached/) });
    expect(decideEngine("auto", me("not_configured"), null).active).toBe("api");
  });
  it("honours Claude Code only and API only", () => {
    expect(decideEngine("claude", me("signed_out"), null)).toMatchObject({ active: null, tone: "bad" });
    expect(decideEngine("api", me("ok"), null)).toMatchObject({ active: "api", reason: expect.stringMatching(/billed per use/i) });
  });
});

function thread(files: StudioThread["files"]): StudioThread {
  return { id: "t1", title: "T", createdAt: "", updatedAt: "", sessionId: null, files, messages: [], outputs: [] };
}
const run = (ctx: Parameters<typeof startApiRun>[0], action: Parameters<typeof startApiRun>[1], o: Record<string, unknown>) =>
  new Promise<StudioEvent[]>((resolve) => {
    const job = startApiRun(ctx, action, o);
    const evs: StudioEvent[] = [];
    followApiJob(job.id, (e) => { evs.push(e); if (e.type === "done") resolve(evs); }, new AbortController().signal);
  });

describe("API engine", () => {
  const calls: { user: string; webSearch: boolean }[] = [];
  let recorded: { outputs: Record<string, string>; status: string; text: string }[] = [];
  beforeEach(() => {
    calls.length = 0; recorded = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      const b = JSON.parse(String(init.body));
      calls.push({ user: b.user, webSearch: b.webSearch });
      let text = `ANSWER ${calls.length}`;
      if (/Proofread/.test(b.user)) text = `Fixed text ${calls.length}\n=== CHANGES ===\n| a | b | why |`;
      if (/Plan a book series/.test(b.user)) text = JSON.stringify({ title: "The Long Road", premise: "A journey.", guide: "## Guide\n\nThemes.", volumes: [{ title: "Beginnings", summary: "s", chapters: [0, 1] }, { title: "Arrival", summary: "s", chapters: [2] }], planned: [{ title: "Home", premise: "p", chapters: [{ title: "Rest", summary: "They rest." }] }] });
      if (/Add citations/.test(b.user)) text = `Cited body ${calls.length} (Smith, 2020)\n## References\n- Smith, J. (2020). Book.\n- Zed, A. (2019). Other.`;
      return new Response(JSON.stringify({ text, sources: b.webSearch ? [{ url: "https://x.org", title: "X" }] : [] }), { status: 200 });
    }));
  });
  const book = Array.from({ length: 4 }, (_, i) => `## Chapter ${i + 1}\n\n${"Words of the chapter. ".repeat(900)}`).join("\n\n");
  const ctx = (text = book): Parameters<typeof startApiRun>[0] => ({
    thread: thread([{ name: "book.docx", storedAs: "book.docx", kind: "original", bytes: 1, at: "" }, { name: "book.docx", storedAs: "book.txt", kind: "text", bytes: 1, at: "" }]),
    readSource: async (s) => (s === "book.txt" ? text : null),
    readOutput: async () => null,
    record: async (r) => { recorded.push(r); },
    manuscript: async () => ({ title: "Walking by Faith", history: [], sections: [
      { id: "s-pre", kind: "preface", title: "Preface", body: "" },
      { id: "s-1", kind: "chapter", title: "The First Step", body: "Faith begins small." },
      { id: "s-2", kind: "chapter", title: "The Long Road", body: "The road is long." },
    ] }),
    voice: async () => voiceProfile,
  });
  let voiceProfile = "";

  it("rewrites a long book chapter by chapter with the same instructions and records it", async () => {
    const ev = await run(ctx(), "rewrite", { instructions: "Modern English only." });
    expect(ev.at(-1)).toMatchObject({ type: "done", status: "done" });
    expect(calls.length).toBe(4);
    expect(calls.every((c) => c.user.includes("Modern English only."))).toBe(true);
    expect(recorded[0].outputs["rewrite.md"]).toContain("ANSWER 4");
    expect(ev.filter((e) => e.type === "tool").map((e) => (e as { line: string }).line)[0]).toMatch(/Rewriting part 1 of 4: Chapter 1/);
  });

  it("cites with web search and merges the references, without duplicates", async () => {
    await run(ctx(), "cite", { citationStyle: "SBL" });
    expect(calls.every((c) => c.webSearch)).toBe(true);
    const refs = recorded[0].outputs["references.md"];
    expect(refs.match(/Smith, J\./g)?.length).toBe(1);
    expect(recorded[0].outputs["cited.md"]).toMatch(/Cited body 1[\s\S]*Cited body 4[\s\S]*## References/);
  });

  it("proofreads into a corrected text and a list of changes", async () => {
    await run(ctx("## One\n\nShort text with a typo."), "tool", { tool: "proofread" });
    expect(recorded[0].outputs["proofread.md"]).toMatch(/^Fixed text 1/);
    expect(recorded[0].outputs["proofread-changes.md"]).toContain("| a | b | why |");
  });

  it("marketing on a short book is one call; scanned-page reading refuses on the API", async () => {
    await run(ctx("## One\n\nA short book."), "tool", { tool: "marketing" });
    expect(calls.length).toBe(1);
    expect(calls[0].user).toMatch(/marketing pack/i);
    const ev = await run(ctx(), "tool", { tool: "ocr" });
    expect(ev.at(-1)).toMatchObject({ status: "failed", error: expect.stringMatching(/needs Claude Code/) });
  });

  it("expands a section with its neighbours, and drafts a preface from the whole book", async () => {
    await run(ctx(), "section", { sectionId: "s-1", op: "expand", factor: 3 });
    expect(calls[0].user).toMatch(/about 3 times its length/);
    expect(calls[0].user).toMatch(/Next section \(The Long Road\)/);
    expect(recorded[0].outputs["sections/s-1.md"]).toBe("ANSWER 1");
    await run(ctx(), "section", { sectionId: "s-pre", op: "draft" });
    expect(calls[1].user).toMatch(/The manuscript:[\s\S]*Faith begins small[\s\S]*The road is long/);
    expect(calls[1].user).toMatch(/why and how the book came to be written/);
  });

  it("voice actions need a profile, then use it and split the notes", async () => {
    voiceProfile = "";
    let ev = await run(ctx(), "section", { sectionId: "s-1", op: "voice" });
    expect(ev.at(-1)).toMatchObject({ status: "failed", error: expect.stringMatching(/voice profile first/) });
    voiceProfile = "# My voice\n\nShort, warm sentences.";
    ev = await run(ctx("## One\n\nSome text."), "tool", { tool: "voice" });
    expect(ev.at(-1)).toMatchObject({ status: "done" });
    expect(calls.at(-1)!.user).toMatch(/Short, warm sentences/);
    expect(Object.keys(recorded.at(-1)!.outputs).sort()).toEqual(["voice-notes.md", "voice.md"]);
  });

  it("turns a book into a series: volumes keep the author's chapters verbatim", async () => {
    const book = "## One\n\nFirst words.\n\n## Two\n\nSecond words.\n\n## Three\n\nThird words.";
    const ev = await run(ctx(book), "tool", { tool: "series", mode: "both" });
    expect(ev.at(-1)).toMatchObject({ status: "done" });
    const out = recorded.at(-1)!.outputs;
    expect(out["volumes/01-beginnings.md"]).toBe("# Beginnings\n\n## One\n\nFirst words.\n\n## Two\n\nSecond words.\n");
    expect(out["volumes/02-arrival.md"]).toContain("Third words.");
    expect(out["planned/01-home.md"]).toMatch(/## Rest\n\nThey rest\./);
    expect(JSON.parse(out["series.json"]).volumes.map((v: { file: string }) => v.file)).toEqual(["volumes/01-beginnings.md", "volumes/02-arrival.md"]);
    expect(out["series-plan.md"]).toMatch(/## Volumes[\s\S]*Beginnings[\s\S]*## Planned books[\s\S]*Home/);
  });

  it("explains when there is nothing readable (a scan) and records the failure", async () => {
    const c = ctx(""); c.thread.files = [{ name: "scan.pdf", storedAs: "scan.pdf", kind: "original", bytes: 1, at: "" }];
    const ev = await run(c, "summarize", {});
    expect(ev.at(-1)).toMatchObject({ status: "failed", error: expect.stringMatching(/Scanned files need Claude Code/) });
    expect(recorded[0].status).toBe("failed");
  });
});
