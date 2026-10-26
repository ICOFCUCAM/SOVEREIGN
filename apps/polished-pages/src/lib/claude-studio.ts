import { supabase } from "@/integrations/supabase/client";
import { extractFileText } from "@/lib/extract-file-text";
import type { BookEngine } from "@/lib/book-engine";
import type { BookOutline } from "@/types/book";

// Client for the Claude Studio runner (services/polished-claude-runner): the
// owner's own Claude Code, reached over HTTPS. Every call carries the signed-in
// Supabase session; the runner checks it and its own allowlist on each request.
export const RUNNER_URL = ((import.meta.env.VITE_CLAUDE_RUNNER_URL as string | undefined) || "").replace(/\/+$/, "");

export type StudioAction = "chat" | "summarize" | "rewrite" | "cite" | "book-outline" | "book-chapter" | "book-improve";

export interface StudioFile { name: string; storedAs: string; kind: "original" | "text"; bytes: number; at: string }
export interface StudioOutput { path: string; bytes: number; modifiedAt: string }
export interface StudioMessage { id: string; role: "user" | "assistant"; action: StudioAction; text: string; at: string; jobId: string; status?: "done" | "failed" | "cancelled"; outputs?: string[] }
export interface StudioThread { id: string; title: string; createdAt: string; updatedAt: string; sessionId: string | null; files: StudioFile[]; messages: StudioMessage[]; outputs: StudioOutput[]; runningJobId?: string }
export interface StudioThreadSummary { id: string; title: string; createdAt: string; updatedAt: string; files: number; outputs: number }
export interface StudioJob { id: string; threadId: string; action: StudioAction; label: string; output: string | null; status: "running" | "done" | "failed" | "cancelled"; startedAt: string; endedAt: string | null; error: string | null }
export interface StudioMe { user: { id: string; email: string | null }; claudeConnected: boolean; busy: StudioJob | null; citationStyles: string[] }
export type StudioEvent =
  | { type: "status"; status: string; line: string; at: string }
  | { type: "text"; text: string; at: string }
  | { type: "tool"; name: string; line: string; at: string }
  | { type: "denied"; line: string; at: string }
  | { type: "notice"; line: string; at: string }
  | { type: "done"; status: StudioJob["status"] | "unknown"; error?: string | null; outputs?: string[]; output?: string | null; at: string };

export interface RunOptions {
  message?: string;
  target?: string; // "source" or a path under out/
  length?: string;
  focus?: string;
  instructions?: string;
  keepStructure?: boolean;
  keepVoice?: boolean;
  audience?: string;
  language?: string;
  addCitations?: boolean;
  citationStyle?: string;
  scope?: "claims" | "all";
  notes?: string;
}

export class StudioError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function token(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new StudioError("Your session has ended. Sign in again.", 401);
  return t;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!RUNNER_URL) throw new StudioError("Claude Studio is not connected to a runner yet.", 0);
  let r: Response;
  try {
    r = await fetch(RUNNER_URL + path, { ...init, headers: { Authorization: `Bearer ${await token()}`, ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...init.headers } });
  } catch (e) {
    if (e instanceof StudioError) throw e;
    throw new StudioError("The Claude Studio runner can't be reached. Check that it is running.", 0);
  }
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new StudioError((body as { error?: string }).error || `The runner answered ${r.status}.`, r.status);
  return body as T;
}

export const studio = {
  me: () => call<StudioMe>("/v1/me"),
  threads: () => call<{ threads: StudioThreadSummary[] }>("/v1/threads").then((r) => r.threads),
  create: (title: string) => call<{ thread: StudioThread }>("/v1/threads", { method: "POST", body: JSON.stringify({ title }) }).then((r) => r.thread),
  thread: (id: string) => call<{ thread: StudioThread; job: StudioJob | null }>(`/v1/threads/${id}`),
  rename: (id: string, title: string) => call<{ thread: StudioThread }>(`/v1/threads/${id}`, { method: "PATCH", body: JSON.stringify({ title }) }).then((r) => r.thread),
  remove: (id: string) => call<{ ok: true }>(`/v1/threads/${id}`, { method: "DELETE" }),
  removeFile: (id: string, storedAs: string) => call<{ thread: StudioThread }>(`/v1/threads/${id}/files/${encodeURIComponent(storedAs)}`, { method: "DELETE" }).then((r) => r.thread),
  run: (id: string, action: StudioAction, options: RunOptions) => call<{ job: StudioJob }>(`/v1/threads/${id}/run`, { method: "POST", body: JSON.stringify({ action, options }) }).then((r) => r.job),
  output: (id: string, path: string) => call<{ path: string; text: string }>(`/v1/threads/${id}/outputs/${path.split("/").map(encodeURIComponent).join("/")}`).then((r) => r.text),
  cancel: (jobId: string) => call<{ job: StudioJob }>(`/v1/jobs/${jobId}/cancel`, { method: "POST" }),
};

const put = (threadId: string, name: string, kind: "original" | "text", body: Blob) =>
  call<{ thread: StudioThread }>(`/v1/threads/${threadId}/files?name=${encodeURIComponent(name)}&kind=${kind}`, { method: "POST", body }).then((r) => r.thread);

export const STUDIO_ACCEPT = ".pdf,.docx,.txt,.md,.markdown,.rtf,.html,.htm,.csv,.json";

/**
 * Uploads a document: the original file (Claude can open a PDF itself when the
 * layout matters) and, where it can be read here, its extracted text.
 */
export async function uploadToStudio(threadId: string, file: File): Promise<StudioThread> {
  let thread = await put(threadId, file.name, "original", file);
  if (/\.(txt|md|markdown)$/i.test(file.name)) return thread; // already plain text
  try {
    const text = await extractFileText(file);
    thread = await put(threadId, file.name, "text", new Blob([text], { type: "text/plain;charset=utf-8" }));
  } catch { /* the original is enough; Claude reads it directly */ }
  return thread;
}

/** Follows a job's events (replayed from the start, then live) until it ends or `signal` aborts. */
export async function followJob(jobId: string, threadId: string, onEvent: (e: StudioEvent) => void, signal: AbortSignal): Promise<void> {
  const r = await fetch(`${RUNNER_URL}/v1/jobs/${jobId}/stream?thread=${encodeURIComponent(threadId)}`, { headers: { Authorization: `Bearer ${await token()}` }, signal });
  if (!r.ok || !r.body) throw new StudioError("The progress of this run can't be followed right now.", r.status);
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buf += value;
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
      const data = chunk.split("\n").filter((l) => l.startsWith("data: ")).map((l) => l.slice(6)).join("\n");
      if (data) { try { onEvent(JSON.parse(data) as StudioEvent); } catch { /* ignore a malformed line */ } }
    }
  }
}

/** The book's title from its first "# " heading, else the fallback. */
export function titleOf(markdown: string, fallback: string): string {
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim().slice(0, 160) || fallback;
}

export const OUTPUT_NAMES: Record<string, string> = {
  "book/outline.json": "Book wizard · outline",
  "summary.md": "Summary",
  "rewrite.md": "Rewritten book",
  "rewrite-notes.md": "Rewrite notes",
  "cited.md": "Text with citations",
  "references.md": "References",
  "citation-report.md": "Citation report",
};

export const outputLabel = (p: string) => OUTPUT_NAMES[p] ?? (p.startsWith("book/chapters/") ? `Book wizard · chapter ${Number(p.slice(14, 16))}` : p.startsWith("book/improved/") ? `Book wizard · improved chapter ${Number(p.slice(14, 16))}` : p.startsWith("rewrite/") ? `Chapter · ${p.slice(8).replace(/\.md$/, "").replace(/^\d+-/, "").replace(/-/g, " ")}` : p);

// ── Book wizard on Claude Code ───────────────────────────────────────────────
// The Book Creator's engine for Claude Studio: each step is a runner job in the
// project, awaited to the end, and its one expected file is the result.
async function runToFile(threadId: string, action: "book-outline" | "book-chapter" | "book-improve", options: Record<string, unknown>): Promise<string> {
  const job = await studio.run(threadId, action as StudioAction, options as RunOptions);
  let end: Extract<StudioEvent, { type: "done" }> | null = null;
  const ctl = new AbortController();
  await followJob(job.id, threadId, (e) => { if (e.type === "done") end = e; }, ctl.signal);
  const done = end as Extract<StudioEvent, { type: "done" }> | null;
  if (!done || done.status !== "done") throw new Error(done?.error || "Claude couldn't finish this step.");
  if (!job.output) throw new Error("The runner did not say where the result is.");
  return studio.output(threadId, job.output);
}

export function claudeBookEngine(threadId: string, onOutline?: (o: BookOutline) => void): BookEngine {
  return {
    label: "Written by your Claude Code",
    async outline(i) {
      const raw = await runToFile(threadId, "book-outline", { ...i });
      let o: BookOutline;
      try { o = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```\s*$/g, "")) as BookOutline; }
      catch { throw new Error("Claude's outline wasn't valid. Try again."); }
      if (!Array.isArray(o?.chapters) || o.chapters.length === 0) throw new Error("Claude's outline has no chapters. Try again.");
      onOutline?.(o);
      return o;
    },
    chapter: ({ previousChapters: _previous, ...i }) => runToFile(threadId, "book-chapter", { ...i }),
    improve: (i) => runToFile(threadId, "book-improve", { ...i }),
  };
}
