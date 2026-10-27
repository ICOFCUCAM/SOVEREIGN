import { authHeader } from "@/lib/session";
import { splitBook } from "@/lib/book-split";
import { extractFileText } from "@/lib/extract-file-text";
import {
  RUNNER_URL, decodeText, followJob, isBookResult, studio, uploadToStudio, type ApprovalSummary, type ResultHistory, type SaveVersion,
  type RunOptions, type StudioAction, type StudioEvent, type StudioJob, type StudioMe, type StudioThread, type StudioThreadSummary,
} from "@/lib/claude-studio";
import { API_SYSTEM, REWRITE_POLICY, SECTION_POLICY, VOICE_RULE, compareApiPrompt, toolApiPlan, toolById, type ToolId } from "@/lib/studio-tools";
import { importText, kindDef, type Manuscript } from "@/lib/manuscript";
import { coverCopyPrompt, parseCoverCopy, type CoverCopyWriter } from "@/lib/cover-copy";

// Which engine does the work, and where projects live.
//   Engine: the owner's Claude Code (on the runner, their plan) or the API (billed per use).
//   Storage: the runner's disk when it's reachable; otherwise this browser.
// "Auto" uses Claude Code whenever it is available and the API otherwise, and
// always says which one is in use and why.

export type EngineMode = "auto" | "claude" | "api";
export type EngineId = "claude-code" | "api";
export interface EngineDecision { active: EngineId | null; reason: string; tone: "ok" | "warn" | "bad"; /** What to do about Claude Code's sign-in, from the runner. */ fix?: string }

export function decideEngine(mode: EngineMode, me: StudioMe | null, runnerError: string | null): EngineDecision {
  const d = decide(mode, me, runnerError);
  const st = me?.claude?.state;
  return (st === "signed_out" || st === "not_configured") && me?.claude?.message ? { ...d, fix: me.claude.message } : d;
}

function decide(mode: EngineMode, me: StudioMe | null, runnerError: string | null): EngineDecision {
  const reachable = Boolean(RUNNER_URL) && !runnerError && Boolean(me);
  const st = me?.claude?.state;
  const until = me?.claude?.resetsAt ? ` until ${new Date(me.claude.resetsAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}` : "";
  const claudeProblem = !RUNNER_URL ? "the Claude Code runner isn't set up"
    : runnerError ? "the Claude Code runner can't be reached"
    : !me ? "connecting to Claude Code…"
    : st === "not_configured" ? "Claude Code isn't signed in on the runner"
    : st === "signed_out" ? "Claude Code is signed out"
    : st === "limit" ? `your Claude plan's limit is reached${until}`
    : null;
  if (mode === "api") return { active: "api", reason: "You chose the API. Billed per use.", tone: "warn" };
  if (mode === "claude") return claudeProblem ? { active: null, reason: `Claude Code only: ${claudeProblem}.`, tone: "bad" } : { active: "claude-code", reason: "Your Claude Code, on your plan.", tone: "ok" };
  if (claudeProblem && reachable === false && !RUNNER_URL) return { active: "api", reason: "Using the API: the Claude Code runner isn't set up. Billed per use.", tone: "warn" };
  if (claudeProblem && me === null && !runnerError) return { active: null, reason: "Connecting…", tone: "warn" };
  if (claudeProblem) return { active: "api", reason: `Switched to the API: ${claudeProblem}. Billed per use.`, tone: "warn" };
  return { active: "claude-code", reason: "Your Claude Code, on your plan.", tone: "ok" };
}

// ── The API engine ───────────────────────────────────────────────────────────

async function callApi(user: string, opts: { system?: string; web?: boolean; maxTokens?: number } = {}): Promise<{ text: string; sources: { url: string; title: string }[] }> {
  const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/studio-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify({ system: opts.system ?? API_SYSTEM, user, webSearch: Boolean(opts.web), maxTokens: opts.maxTokens ?? 16000 }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (body as { error?: string }).error || `The API answered ${r.status}.`;
    if (/credit balance is too low/i.test(msg)) throw new Error("The Anthropic API account has no credit left. Add credit at console.anthropic.com → Plans & Billing (separate from your Claude subscription), or use Claude Code.");
    throw new Error(msg);
  }
  return body as { text: string; sources: { url: string; title: string }[] };
}

/** Cover copy on the API (billed per use), from the book's opening, headings and close when it's long. */
export const apiCoverCopyWriter: CoverCopyWriter = {
  label: "API",
  write: async (i) => parseCoverCopy((await callApi(coverCopyPrompt(i), { maxTokens: 4000 })).text),
};

interface ApiContext {
  thread: StudioThread;
  readSource: (storedAs: string) => Promise<string | null>;
  readOutput: (path: string) => Promise<string | null>;
  record: (r: { action: StudioAction; userText: string; text: string; outputs: Record<string, string>; status: "done" | "failed" }) => Promise<void>;
  manuscript: () => Promise<Manuscript | null>;
  voice: () => Promise<string>;
}

interface LocalJob { job: StudioJob; events: StudioEvent[]; subs: Set<(e: StudioEvent) => void>; cancelled: boolean }
const apiJobs = new Map<string, LocalJob>();

function emit(j: LocalJob, e: Omit<StudioEvent, "at">) {
  const ev = { ...e, at: new Date().toISOString() } as StudioEvent;
  j.events.push(ev);
  j.subs.forEach((s) => s(ev));
}

export function followApiJob(jobId: string, onEvent: (e: StudioEvent) => void, signal: AbortSignal): Promise<void> {
  const j = apiJobs.get(jobId);
  if (!j) { onEvent({ type: "done", status: "unknown", at: new Date().toISOString() }); return Promise.resolve(); }
  j.events.forEach(onEvent);
  if (j.job.status !== "running") return Promise.resolve();
  return new Promise((resolve) => {
    const sub = (e: StudioEvent) => { onEvent(e); if (e.type === "done") { j.subs.delete(sub); resolve(); } };
    j.subs.add(sub);
    signal.addEventListener("abort", () => { j.subs.delete(sub); resolve(); });
  });
}

async function documentText(ctx: ApiContext, target?: string): Promise<{ text: string; skipped: string[] }> {
  if (target && target !== "source") return { text: (await ctx.readOutput(target)) ?? "", skipped: [] };
  return sourceText(ctx.thread.files, ctx.readSource);
}

/** The text of the project's uploaded documents (their extracted copies), in order; files with no readable text are listed. */
export async function sourceText(files: StudioThread["files"], read: (storedAs: string) => Promise<string | null>): Promise<{ text: string; skipped: string[] }> {
  const skipped: string[] = [];
  const parts: string[] = [];
  const originals = files.filter((f) => f.kind === "original");
  for (const f of originals) {
    const copy = files.find((x) => x.kind === "text" && x.storedAs !== f.storedAs && x.storedAs === f.storedAs.replace(/\.[^.]+$/, "") + ".txt");
    let text: string | null = null;
    if (copy) text = await read(copy.storedAs);
    else if (/\.(txt|md|markdown|csv|json|html?)$/i.test(f.storedAs)) text = await read(f.storedAs);
    if (text && text.trim()) parts.push(originals.length > 1 ? `# ${f.name.replace(/\.[^.]+$/, "")}\n\n${text.trim()}` : text.trim());
    else skipped.push(f.name);
  }
  return { text: parts.join("\n\n"), skipped };
}

async function pathText(ctx: ApiContext, p: string) {
  if (p.startsWith("out/")) return (await ctx.readOutput(p.slice(4))) ?? "";
  if (p.startsWith("source/")) return (await ctx.readSource(p.slice(7))) ?? "";
  return "";
}

const ONE_CALL = 120_000;

/** Runs one Studio action on the API, chapter by chapter where needed, and records the result in the project. */
// The approaches to writing a section on the API: the owner's book is sent with the request.
const FIND_API = "find every part of the owner's book (below) that belongs to this section's subject";
const API_APPROACHES: Record<string, string> = {
  polish: `Polish the owner's own book: ${FIND_API} and keep the author's own words wherever they work. Only fix order, clarity, grammar and flow and join the scattered parts into one well-ordered section. Do not add new material or change the author's arguments.`,
  mine: `Build this section only from the owner's own book: ${FIND_API} and carry over all of the author's teaching, arguments, facts, scriptures and examples, reorganised and improved in better prose. Add nothing from outside the book.`,
  "mine-and-research": `Build this section from the owner's own book first: ${FIND_API} and carry over all of the author's teaching, reorganised and improved. Then strengthen it with other scholarly and primary sources found on the web. The author's position leads; present other views as other views. Cite every added fact or quotation (author, year) and end with "### Sources".`,
  research: `Write this section mainly from research on the web, building a thorough, well-evidenced section on its subject, arguing the owner's viewpoint from their book (below), which it must not contradict. Cite every fact or quotation (author, year) and end with "### Sources".`,
};
const API_IMPROVE: Record<string, string> = {
  enhance: "Enhance the writing quality: improve prose, strengthen arguments, add vivid examples and make it more engaging. Keep the same structure and key points.",
  expand: "Expand this content with more detail, examples, case studies and practical insights. Double the depth without adding fluff.",
  tighten: "Tighten this content: remove redundancy, sharpen arguments, improve clarity. Reduce length by 20-30% while keeping all key points.",
  hooks: "Rewrite the opening with a powerful hook, add compelling transitions, and make the ending memorable.",
  examples: "Add real-world examples, case studies and practical applications throughout.",
  consistency: "Enforce consistency in tone, terminology, formatting and style.",
};

/** What the owner has said about the book and this section, in priority order (the same order the runner uses). */
export function sectionContext(m: Manuscript, sec: Manuscript["sections"][number], o: { idea?: string; rules?: string } = {}): string {
  const pages = (sec.pageNotes ?? []).filter((n) => n.text.trim()).map((n) => `- Page ${n.page}: ${n.text.replace(/\s+/g, " ")}`).join("\n");
  const idea = (sec.idea || o.idea || "").trim();
  const rules = (m.rules || o.rules || "").trim();
  const k = m.knowledge;
  const knowledge = k ? [k.rules?.trim() && `Rules (highest priority):\n${k.rules.trim()}`, k.terminology?.trim() && `Required terminology:\n${k.terminology.trim()}`, k.forbidden?.trim() && `Forbidden: never use or mention\n${k.forbidden.trim()}`].filter(Boolean).join("\n\n") : "";
  return [
    pages && `The owner's notes on particular pages of their book (highest priority):\n${pages}`,
    idea && `The owner's idea for this section (follow it):\n${idea}`,
    rules && `Rules for the whole book (follow strictly, everywhere, including quotations and material from other sources, unless the rule says otherwise):\n${rules}`,
    knowledge && `Knowledge base for the whole book (obey strictly):\n${knowledge}`,
  ].filter(Boolean).join("\n\n");
}

export function startApiRun(ctx: ApiContext, action: StudioAction, o: RunOptions & Record<string, unknown>): StudioJob {
  const SECTION_OPS: Record<string, string> = { explain: "What this section says", rewrite: "Rewrite section", compose: "Write section", improve: "Improve section", expand: "Expand section", cite: "Add citations to section", voice: "Section in my voice", edit: "Edit section", draft: "Draft" };
  const label = action === "section" ? `${SECTION_OPS[String(o.op)] ?? "Section"} · ${o.title ?? ""}` : action === "tool" ? toolById(String(o.tool))?.title ?? "Tool" : ({ chat: "Chat", summarize: "Summarise", rewrite: o.correct ? "Correct the problems" : "Rewrite", cite: "Citations & references" } as Record<string, string>)[action] ?? action;
  const job: StudioJob = { id: crypto.randomUUID(), threadId: ctx.thread.id, action, label, output: null, status: "running", startedAt: new Date().toISOString(), endedAt: null, error: null };
  const j: LocalJob = { job, events: [], subs: new Set(), cancelled: false };
  apiJobs.set(job.id, j);
  const say = (line: string) => emit(j, { type: "tool", name: "api", line } as Omit<StudioEvent, "at">);
  const check = () => { if (j.cancelled) throw new Error("__cancelled"); };
  const userText = action === "section" ? `${label}${o.instructions ? `\n\n${o.instructions}` : ""}` : action === "chat" ? String(o.message ?? "") : `${label}${o.target && o.target !== "source" ? ` · ${o.target}` : ""}${action === "rewrite" ? `\n\n${String(o.instructions ?? "")}` : ""}`;

  (async () => {
    emit(j, { type: "status", status: "running", line: "Working on the API…" } as Omit<StudioEvent, "at">);
    const outputs: Record<string, string> = {};
    let reply = "";
    const per = async (text: string, make: (t: string, i: number, n: number) => string, web = false, verb = "Working on") => {
      const parts = text.length <= 14_000 * 1.2 ? [text] : splitBook(text);
      const out: string[] = [];
      for (let i = 0; i < parts.length; i++) {
        check();
        const head = /^#{1,3}\s+(.+)$/m.exec(parts[i])?.[1];
        say(`${verb} part ${i + 1} of ${parts.length}${head ? `: ${head.slice(0, 60)}` : ""}${web ? " (searching the web)" : ""}`);
        const r = await callApi(make(parts[i], i, parts.length), { web });
        out.push(r.text.trim());
        if (r.sources.length) say(`${r.sources.length} sources consulted`);
      }
      return out;
    };
    try {
      if (action === "section") {
        const m = await ctx.manuscript();
        const i = m?.sections.findIndex((x) => x.id === o.sectionId) ?? -1;
        if (!m || i < 0) throw new Error("Save the manuscript first, then try again.");
        const sec = m.sections[i];
        const def = kindDef(sec.kind);
        const needsVoice = o.op === "voice" || o.useVoice;
        const voice = needsVoice ? await ctx.voice() : "";
        if (needsVoice && !voice.trim()) throw new Error("Create your voice profile first (Learn my voice), then save it as your profile.");
        const outline = m.sections.map((x, n) => `${n + 1}. ${x.title} (${kindDef(x.kind).label})`).join("\n");
        const whole = m.sections.map((x) => `## ${x.title}\n\n${x.body}`).join("\n\n");
        const book = whole.length <= 300_000 ? whole : m.sections.map((x) => `## ${x.title}\n\n${x.body.slice(0, 3000)}${x.body.length > 3000 ? "\n[…]" : ""}`).join("\n\n");
        const near = `${m.sections[i - 1] ? `Previous section (${m.sections[i - 1].title}), end:\n${m.sections[i - 1].body.slice(-2000)}\n\n` : ""}${m.sections[i + 1] ? `Next section (${m.sections[i + 1].title}), start:\n${m.sections[i + 1].body.slice(0, 2000)}\n\n` : ""}`;
        const ops: Record<string, string> = {
          expand: `Expand this section to about ${o.factor || 2} times its length: deepen the explanation, add concrete examples, transitions and detail that fit the rest of the book. Keep every existing point, quotation and reference, and the author's voice.${o.instructions ? ` The owner asks: ${o.instructions}` : ""}`,
          cite: `Add citations to this section in ${o.citationStyle || "APA 7"} style. Search the web and check each source supports the claim. Keep the text otherwise unchanged; mark unsupported claims [citation needed]. End with "### Sources" listing only sources you used, with URL and access date.`,
          voice: "Rewrite this section in the owner's voice. Keep its meaning, facts, quotations and references.",
          edit: `Revise this section as the owner asks: ${o.instructions || "improve clarity and flow"}. Keep facts, quotations and references accurate.`,
          explain: "Tell the owner what this section says, in plain language: its main teaching in two or three sentences, then its key points as a short list, then the scriptures, quotations and sources it relies on. Report faithfully; do not rewrite, correct or judge it.",
          rewrite: `Rewrite this section so it keeps all of the author's knowledge and teaching but is well organised, clear and arranged in a logical order (with "### " sub-headings where they help). Keep every fact, scripture reference and quotation accurate apart from what the rules change.\nEditorial standard:\n${SECTION_POLICY.map((l) => `- ${l}`).join("\n")}\nNumbering continues the book's scheme: see the neighbouring sections.`,
          compose: `${API_APPROACHES[String(o.approach)] ?? "Write this section new, from the book's plan, the other sections and the owner's notes. Never invent facts about the author; use [placeholders] where a fact is needed."} Use "### " for sub-headings, short paragraphs, no meta-commentary.`,
          improve: `${API_IMPROVE[String(o.improvementType)] ?? API_IMPROVE.enhance} Keep the Markdown structure.`,
          draft: `Write the "${sec.title}" section of this book. Guidance: ${o.guidance || def.guidance}.${o.instructions ? ` The owner asks: ${o.instructions}` : ""} Never invent facts about the author; use [placeholders] where a fact is needed.`,
        };
        if (!ops[String(o.op)]) throw new Error("Unknown section action.");
        // The owner's own book, for the approaches that build on it.
        const usesBook = o.op === "compose" && String(o.approach) in API_APPROACHES;
        const owner = usesBook ? (await documentText(ctx)).text : "";
        if (usesBook && !owner.trim()) throw new Error("Upload your book to this project first, so Claude can build on it.");
        const context = o.op === "explain" ? "" : sectionContext(m, sec, o);
        say(`${label} (${o.op === "draft" && def.wholeBook ? "reading the whole book" : "reading the section and its neighbours"})`);
        const prompt = `Book: ${m.title || "Untitled"}\nSections:\n${outline}\n\n${o.op === "draft" && def.wholeBook ? `The manuscript:\n\n${book}\n\n` : near}${owner ? `The owner's own book (their uploaded documents):\n\n${owner.slice(0, 300_000)}\n\n` : ""}---\n\nThe section to work on: "${sec.title}" (${def.label})\n\n${sec.body || "(empty)"}\n\n---\n\n${ops[String(o.op)]}${context ? `\n\n${context}` : ""}${needsVoice ? `\n${VOICE_RULE}\nVoice profile:\n${voice}` : ""}\n${o.op === "explain" ? "Reply with only the summary." : 'Reply with only the new text of this section: no "## " heading, no commentary.'}`;
        const r = await callApi(prompt, { web: o.op === "cite" || (o.op === "compose" && (o.approach === "mine-and-research" || o.approach === "research")) });
        outputs[o.op === "explain" ? `sections/${sec.id}-summary.md` : `sections/${sec.id}.md`] = r.text.trim();
        reply = `${label}: suggestion ready.`;
      } else if (action === "chat") {
        const { text } = await documentText(ctx);
        const history = ctx.thread.messages.slice(-12).map((m) => `${m.role === "user" ? "Owner" : "Claude"}: ${m.text.slice(0, 4000)}`).join("\n\n");
        const doc = text.length > 300_000 ? `${text.slice(0, 300_000)}\n\n[The rest of the document is not included on the API: it is longer than one request allows.]` : text;
        say("Reading the project and your message");
        reply = (await callApi(`${doc ? `The owner's documents:\n\n${doc}\n\n---\n\n` : ""}${history ? `Conversation so far:\n\n${history}\n\n---\n\n` : ""}Owner: ${String(o.message ?? "")}`, { web: true })).text;
      } else {
        const { text, skipped } = await documentText(ctx, o.target);
        if (skipped.length) say(`Skipped on the API (no readable text; Claude Code can read these): ${skipped.join(", ")}`);
        if (!text.trim() && !(action === "tool" && o.tool === "compare")) throw new Error("There's no readable text to work on. Scanned files need Claude Code (Read scanned pages).");
        if (action === "summarize") {
          const len = ({ brief: "about 300 words", detailed: "as long as needed, with a summary of every chapter" } as Record<string, string>)[String(o.length)] ?? "about 800 words";
          const ask = `Summarise the document. Length: ${len}.${o.focus ? ` Focus on: ${o.focus}.` : ""} Give the title, a one-paragraph overview, key points as a list, and for a long document a short summary of each chapter. Add nothing that isn't in the document. Start with "# <title> — Summary".`;
          if (text.length <= ONE_CALL) { say("Summarising"); outputs["summary.md"] = (await callApi(`${ask}\n\n${text}`)).text; }
          else {
            const notes = await per(text, (t, i, n) => `Summarise part ${i + 1} of ${n} of a long document in 250 words, keeping chapter names.\n\n${t}`, false, "Summarising");
            check(); say("Writing the final summary");
            outputs["summary.md"] = (await callApi(`${ask}\n\nThe document, as part summaries:\n\n${notes.join("\n\n")}`)).text;
          }
          reply = "Summary written.";
        } else if (action === "rewrite" && o.correct) {
          // Targeted correction of the editorial check's findings (DESIGN-SPEC.md §15b, stage 5): fix those, keep the rest.
          const rules = `The problems to fix:\n${String(o.instructions ?? "").trim()}\n\nFix only these problems where they occur in this part; every other passage stays exactly as it is. Where a fix needs the author (a missing chapter, a claim without a source, a sensitive claim), change nothing there.\nEditorial standard:\n${REWRITE_POLICY.map((l) => `- ${l}`).join("\n")}`;
          const parts = await per(text, (t, i, n) => `Correct this text (part ${i + 1} of ${n}) following the rules, and reply with the complete corrected text only.\n\n${rules}\n\n---\n\n${t}`, false, "Correcting");
          outputs["corrected.md"] = parts.join("\n\n") + "\n";
          outputs["corrected-notes.md"] = `# Correction notes\n\nCorrected on the API in ${parts.length} part${parts.length === 1 ? "" : "s"}. Open the corrected book and run the Editorial check again to see what remains.\n\n## The problems given\n\n${String(o.instructions ?? "").trim()}\n`;
          reply = `Corrected the listed problems in ${parts.length} part${parts.length === 1 ? "" : "s"}.`;
        } else if (action === "rewrite") {
          const rules = [`Owner's instructions (follow strictly):\n${String(o.instructions ?? "").trim()}`,
            o.keepStructure === false ? "You may reorganise where the instructions call for it." : "Keep every chapter and section, in order, with the same headings unless told otherwise.",
            o.keepVoice === false ? "Adopt the voice the instructions describe." : "Keep the author's voice.",
            ({ shorter: "Make it noticeably shorter.", longer: "Expand where it adds value." } as Record<string, string>)[String(o.length)] ?? "Keep about the same length.",
            o.audience ? `Audience: ${o.audience}.` : "", o.language ? `Write in ${o.language}.` : "",
            "Keep every fact, name, date, quotation and reference accurate. Never summarise in place of rewriting.",
            o.addCitations ? `Add in-text citations in ${o.citationStyle || "APA 7"} style from sources you find, ending with "## References". List only sources you used; never cite a claim no source supports.` : "",
            `Editorial standard (this is editing a book, not polishing sentences):\n${SECTION_POLICY.map((l) => `- ${l}`).join("\n")}`].filter(Boolean).join("\n");
          const parts = await per(text, (t, i, n) => `Rewrite this text following the rules. This is part ${i + 1} of ${n}; rewrite it in full and reply with the rewritten text only.${i ? " Continue the numbering of the earlier parts." : ""}\n\n${rules}\n\n---\n\n${t}`, Boolean(o.addCitations), "Rewriting");
          outputs["rewrite.md"] = parts.join("\n\n") + "\n";
          // The API returns text only, so the editorial report is the app's own check (open the rewrite: Editorial check).
          outputs["rewrite-notes.md"] = `# Rewrite notes\n\nRewritten on the API in ${parts.length} part${parts.length === 1 ? "" : "s"}, each with the same instructions. Open the rewrite and choose Editorial check: it compares the rewrite with your original (scripture, quotations, qualifications, additions) and checks numbering, placeholders, references, front matter and terminology.\n\n## The instructions\n\n${rules}\n\n## The full editorial standard\n\n${REWRITE_POLICY.map((l) => `- ${l}`).join("\n")}\n`;
          reply = `Rewrote the document in ${parts.length} part${parts.length === 1 ? "" : "s"}.`;
        } else if (action === "cite") {
          const style = o.citationStyle || "APA 7";
          const parts = await per(text, (t, i, n) => `Add citations to this text (part ${i + 1} of ${n}) in ${style} style. Scope: ${o.scope === "all" ? "every factual claim" : "quotations, statistics, dates and specific claims"}.${o.notes ? ` The owner adds: ${o.notes}.` : ""} Search the web, open the best sources, and check they support each claim. Keep the text unchanged apart from in-text citations; mark unsupported claims [citation needed]. End with "## References" listing only sources you used.\n\n${t}`, true, "Citing");
          const refs = new Set<string>(); const bodies: string[] = [];
          for (const p of parts) {
            const [body, ref = ""] = p.split(/\n##\s+References\s*\n/i);
            bodies.push(body.trim());
            ref.split("\n").map((l) => l.trim()).filter((l) => /^[-*\d]/.test(l)).forEach((l) => refs.add(l.replace(/^(\d+[.)]|[-*])\s*/, "- ")));
          }
          const refList = [...refs].sort((a, b) => a.localeCompare(b)).join("\n");
          outputs["cited.md"] = `${bodies.join("\n\n")}\n\n## References\n\n${refList}\n`;
          outputs["references.md"] = `# References\n\n${refList}\n`;
          reply = `Added citations (${refs.size} sources).`;
        } else if (action === "tool") {
          const id = String(o.tool) as ToolId;
          const meta = toolById(id);
          if (!meta) throw new Error("Unknown tool.");
          if (meta.claudeOnly) throw new Error(`${meta.title} needs Claude Code: it reads the scanned images itself.`);
          if (id === "series") {
            Object.assign(outputs, await seriesOnApi(text, o, say));
          } else if (id === "compare") {
            const a = String(o.a ?? ""), b = String(o.b ?? "");
            const [ta, tb] = [await pathText(ctx, a), await pathText(ctx, b)];
            if (!ta || !tb) throw new Error("Both versions need readable text.");
            say("Comparing the two versions");
            outputs["compare.md"] = (await callApi(compareApiPrompt(ta.slice(0, 600_000), tb.slice(0, 600_000), a, b))).text;
          } else {
            const voice = id === "voice" ? await ctx.voice() : "";
            if (id === "voice" && !voice.trim()) throw new Error("Create your voice profile first (Learn my voice), then save it as your profile.");
            const plan = toolApiPlan(id, { ...o, _voice: voice })!;
            const finishIsPrompt = id === "index" || id === "marketing" || id === "readability" || id === "voice-profile";
            const parts = finishIsPrompt && text.length <= ONE_CALL ? [text] : await per(text, plan.part, Boolean(plan.web), meta.title);
            check();
            let main: string;
            if (plan.split === "changes") {
              const fixed = parts.map((p) => p.split(/\n=== CHANGES ===\n/)[0].trim());
              const changes = parts.map((p, i) => `${parts.length > 1 ? `## Part ${i + 1}\n\n` : ""}${(p.split(/\n=== CHANGES ===\n/)[1] ?? "No changes listed.").trim()}`);
              main = fixed.join("\n\n") + "\n";
              outputs["proofread-changes.md"] = `# Changes\n\n${changes.join("\n\n")}\n`;
            } else if (plan.split === "notes") {
              main = parts.map((p) => p.split(/\n=== NOTES ===\n/)[0].trim()).join("\n\n") + "\n";
              outputs["voice-notes.md"] = `# Voice notes & authorship\n\nRewritten in the owner's voice on the API in ${parts.length} part${parts.length === 1 ? "" : "s"}.\n\n${parts.map((p, i) => `${parts.length > 1 ? `## Part ${i + 1}\n\n` : ""}${(p.split(/\n=== NOTES ===\n/)[1] ?? "").trim()}`).join("\n\n")}\n`;
            } else if (finishIsPrompt) { say("Putting it together"); main = (await callApi(plan.finish!(parts), { web: false })).text; }
            else main = plan.finish ? plan.finish(parts) : parts.join("\n\n");
            outputs[meta.output(o)] = main;
            if (id === "index" && o.kind === "both") outputs["glossary.md"] = (/(#\s+Glossary[\s\S]*)$/i.exec(main)?.[1] ?? "");
            if (!outputs["glossary.md"]) delete outputs["glossary.md"];
          }
          reply = `${meta.title} done.`;
        }
      }
      check();
      await ctx.record({ action, userText, text: reply, outputs, status: "done" });
      job.status = "done"; job.endedAt = new Date().toISOString();
      emit(j, { type: "done", status: "done", outputs: Object.keys(outputs), output: Object.keys(outputs)[0] ?? null } as Omit<StudioEvent, "at">);
    } catch (e) {
      const cancelled = e instanceof Error && e.message === "__cancelled";
      job.status = cancelled ? "cancelled" : "failed"; job.endedAt = new Date().toISOString();
      job.error = cancelled ? null : e instanceof Error ? e.message : "The API run failed.";
      await ctx.record({ action, userText, text: cancelled ? "Stopped." : `Couldn't finish on the API: ${job.error}`, outputs, status: "failed" }).catch(() => {});
      emit(j, { type: "done", status: job.status, error: job.error, outputs: Object.keys(outputs) } as Omit<StudioEvent, "at">);
    }
  })();
  return job;
}

const slug = (t: string) => t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "book";

/** Series on the API: one planning call; volumes are then assembled from the author's own chapters, verbatim. */
async function seriesOnApi(text: string, o: Record<string, unknown>, say: (l: string) => void): Promise<Record<string, string>> {
  const split = o.mode !== "continue", cont = o.mode === "continue" || o.mode === "both";
  const n = Number(o.volumes) > 0 ? Number(o.volumes) : null;
  const book = importText("", text);
  const chapters = book.sections;
  say(`Planning the series from ${chapters.length} chapters`);
  const list = chapters.map((c, i) => `${i}. ${c.title} (${c.body.split(/\s+/).length} words): ${c.body.slice(0, 600).replace(/\s+/g, " ")}`).join("\n");
  const r = await callApi(`Plan a book series from this book${o.audience ? ` for ${o.audience}` : ""}.
${split ? `Split it into ${n ? n : "the number of volumes that reads best (usually 2-5)"} volumes at natural turning points: whole chapters, in order, every chapter used once.` : ""}
${cont ? `Plan ${n && !split ? n : "2-3"} new books that continue it (same world, themes and voice), each with chapter titles and 2-3 sentence summaries.` : ""}
Reply with JSON only: {"title": "", "premise": "", "guide": "markdown series guide: themes or arguments, recurring people, places, key terms, timeline, voice", "volumes": [{"title": "", "summary": "", "chapters": [chapter numbers]}], "planned": [{"title": "", "premise": "", "chapters": [{"title": "", "summary": ""}]}]}
${split ? "" : 'Use "volumes": [].'} ${cont ? "" : 'Use "planned": [].'}

Book: ${book.title || "Untitled"}
Chapters (number. title (words): opening):
${list}`, { maxTokens: 16000 });
  let plan: { title?: string; premise?: string; guide?: string; volumes?: { title: string; summary?: string; chapters: number[] }[]; planned?: { title: string; premise?: string; chapters: { title: string; summary: string }[] }[] };
  try { plan = JSON.parse(r.text.replace(/^```(?:json)?\s*|\s*```\s*$/g, "")); } catch { throw new Error("The series plan wasn't valid. Try again."); }
  const out: Record<string, string> = {};
  const manifest = { title: plan.title ?? "Series", premise: plan.premise ?? "", volumes: [] as { title: string; file: string }[], planned: [] as { title: string; file: string }[] };
  (plan.volumes ?? []).forEach((v, i) => {
    const file = `volumes/${String(i + 1).padStart(2, "0")}-${slug(v.title)}.md`;
    const body = (v.chapters ?? []).map((k) => chapters[k]).filter(Boolean).map((c) => `## ${c.title}\n\n${c.body}`).join("\n\n");
    out[file] = `# ${v.title}\n\n${body}\n`;
    manifest.volumes.push({ title: v.title, file });
  });
  (plan.planned ?? []).forEach((b, i) => {
    const file = `planned/${String(i + 1).padStart(2, "0")}-${slug(b.title)}.md`;
    out[file] = `# ${b.title}\n\n${b.premise ?? ""}\n\n${(b.chapters ?? []).map((c) => `## ${c.title}\n\n${c.summary}`).join("\n\n")}\n`;
    manifest.planned.push({ title: b.title, file });
  });
  const used = new Set((plan.volumes ?? []).flatMap((v) => v.chapters ?? []));
  const missing = split ? chapters.filter((_, i) => !used.has(i)).map((c) => c.title) : [];
  out["series-plan.md"] = `# ${manifest.title}\n\n${manifest.premise}\n\n${plan.guide ?? ""}\n\n${manifest.volumes.length ? `## Volumes\n\n${(plan.volumes ?? []).map((v, i) => `${i + 1}. **${v.title}**: ${v.summary ?? ""} (chapters ${(v.chapters ?? []).map((k) => chapters[k]?.title).filter(Boolean).join(", ")})`).join("\n")}\n\n` : ""}${manifest.planned.length ? `## Planned books\n\n${(plan.planned ?? []).map((b, i) => `${i + 1}. **${b.title}**: ${b.premise ?? ""}`).join("\n")}\n\n` : ""}${missing.length ? `> Chapters not placed in a volume: ${missing.join(", ")}\n` : ""}`;
  out["series.json"] = JSON.stringify(manifest, null, 2);
  return out;
}

export function cancelApiJob(jobId: string) { const j = apiJobs.get(jobId); if (j) j.cancelled = true; }

// ── Backends ─────────────────────────────────────────────────────────────────

export interface StudioBackend {
  storage: "runner" | "browser";
  threads(): Promise<StudioThreadSummary[]>;
  create(title: string): Promise<StudioThread>;
  thread(id: string): Promise<{ thread: StudioThread; job: StudioJob | null }>;
  rename(id: string, title: string): Promise<StudioThread>;
  remove(id: string): Promise<unknown>;
  removeFile(id: string, storedAs: string): Promise<StudioThread>;
  upload(id: string, file: File): Promise<StudioThread>;
  run(id: string, action: StudioAction, options: RunOptions, engine: EngineId): Promise<StudioJob>;
  follow(job: StudioJob, onEvent: (e: StudioEvent) => void, signal: AbortSignal): Promise<void>;
  output(id: string, path: string): Promise<string>;
  cancel(job: StudioJob): Promise<unknown>;
  source(id: string, storedAs: string): Promise<string | null>;
  manuscript(id: string): Promise<Manuscript | null>;
  saveManuscript(id: string, m: Manuscript): Promise<Manuscript>;
  voice(): Promise<string>;
  saveVoice(v: string): Promise<unknown>;
  /** Versions of a whole-book result, and its approval as publication-ready (DESIGN-SPEC.md §16). */
  history(id: string, path: string): Promise<ResultHistory>;
  version(id: string, path: string, n: number): Promise<string>;
  saveOutput(id: string, path: string, text: string, o: SaveVersion): Promise<ResultHistory>;
  approve(id: string, path: string, a: { version: number; summary: ApprovalSummary }): Promise<ResultHistory>;
}

const runnerApiCtx = async (id: string): Promise<ApiContext> => {
  const { thread } = await studio.thread(id);
  return {
    thread,
    readSource: (s) => studio.source(id, s).catch(() => null),
    readOutput: (p) => studio.output(id, p).catch(() => null),
    record: async (r) => { await studio.record(id, r); },
    manuscript: () => studio.manuscript(id),
    voice: () => studio.voice(),
  };
};

export const runnerBackend: StudioBackend = {
  storage: "runner",
  threads: () => studio.threads(),
  create: (t) => studio.create(t),
  thread: (id) => studio.thread(id),
  rename: (id, t) => studio.rename(id, t),
  remove: (id) => studio.remove(id),
  removeFile: (id, s) => studio.removeFile(id, s),
  upload: (id, f) => uploadToStudio(id, f),
  run: async (id, action, options, engine) => (engine === "claude-code" ? studio.run(id, action, options) : startApiRun(await runnerApiCtx(id), action, options as RunOptions & Record<string, unknown>)),
  follow: (job, onEvent, signal) => (apiJobs.has(job.id) ? followApiJob(job.id, onEvent, signal) : followJob(job.id, job.threadId, onEvent, signal)),
  output: (id, p) => studio.output(id, p),
  cancel: (job) => (apiJobs.has(job.id) ? Promise.resolve(cancelApiJob(job.id)) : studio.cancel(job.id)),
  source: (id, s) => studio.source(id, s).catch(() => null),
  manuscript: (id) => studio.manuscript(id),
  saveManuscript: (id, m) => studio.saveManuscript(id, m),
  voice: () => studio.voice(),
  saveVoice: (v) => studio.saveVoice(v),
  history: (id, p) => studio.history(id, p),
  version: (id, p, n) => studio.version(id, p, n),
  saveOutput: (id, p, t, o) => studio.saveOutput(id, p, t, o),
  approve: (id, p, a) => studio.approve(id, p, a),
};

// Browser storage for when the runner is offline: projects, files' text and
// results live in this browser (IndexedDB) and every run goes to the API.
const DB = "claude-studio";
let dbp: Promise<IDBDatabase> | null = null;
function openDb(): Promise<IDBDatabase> {
  dbp ??= new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => { open.result.createObjectStore("threads", { keyPath: "id" }); open.result.createObjectStore("blobs"); };
    open.onerror = () => { dbp = null; reject(open.error); };
    open.onsuccess = () => resolve(open.result);
  });
  return dbp;
}
async function req<T>(name: "threads" | "blobs", mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = fn(db.transaction(name, mode).objectStore(name));
    r.onsuccess = () => resolve(r.result as T);
    r.onerror = () => reject(r.error);
  });
}
const store = (name: "threads" | "blobs") => ({
  get: <T>(key: string) => req<T | undefined>(name, "readonly", (s) => s.get(key)),
  put: (value: unknown, key?: string) => req<void>(name, "readwrite", (s) => s.put(value, key)),
  del: (key: string) => req<void>(name, "readwrite", (s) => s.delete(key)),
  all: <T>() => req<T[]>(name, "readonly", (s) => s.getAll()),
});
const threadsDb = store("threads");
const blobsDb = store("blobs");
const bkey = (id: string, kind: "src" | "out", name: string) => `${id}|${kind}|${name}`;

async function saveLocal(t: StudioThread) { t.updatedAt = new Date().toISOString(); await threadsDb.put(t); return t; }
async function localThread(id: string) { const t = await threadsDb.get<StudioThread>(id); if (!t) throw new Error("Project not found."); return t; }

// Versions of whole-book results in this browser, as the runner keeps them (DESIGN-SPEC.md §16).
async function localHistory(id: string, p: string): Promise<ResultHistory> {
  return (await blobsDb.get<ResultHistory>(`${id}|hist|${p}`)) ?? { path: p, versions: [], approval: null };
}
async function localRecord(id: string, p: string, op: string, label?: string): Promise<ResultHistory> {
  const h = await localHistory(id, p);
  const text = await blobsDb.get<string>(bkey(id, "out", p));
  if (text == null) return h;
  const last = h.versions.at(-1);
  if (last && (await blobsDb.get<string>(`${id}|ver|${p}|${last.n}`)) === text) return h;
  const n = (last?.n ?? 0) + 1;
  await blobsDb.put(text, `${id}|ver|${p}|${n}`);
  h.versions.push({ n, at: new Date().toISOString(), op, ...(label ? { label } : {}), bytes: text.length, words: (text.match(/\S+/g) ?? []).length });
  for (const old of h.versions.splice(0, Math.max(0, h.versions.length - 30))) await blobsDb.del(`${id}|ver|${p}|${old.n}`);
  await blobsDb.put(h, `${id}|hist|${p}`);
  return h;
}

export const browserBackend: StudioBackend = {
  storage: "browser",
  threads: async () => (await threadsDb.all<StudioThread>()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((t) => ({ id: t.id, title: t.title, createdAt: t.createdAt, updatedAt: t.updatedAt, files: t.files.length, outputs: t.outputs.length })),
  create: async (title) => { const now = new Date().toISOString(); return saveLocal({ id: crypto.randomUUID(), title, createdAt: now, updatedAt: now, sessionId: null, files: [], messages: [], outputs: [] }); },
  thread: async (id) => ({ thread: await localThread(id), job: null }),
  rename: async (id, title) => { const t = await localThread(id); t.title = title; return saveLocal(t); },
  remove: async (id) => {
    const t = await localThread(id);
    for (const f of t.files) await blobsDb.del(bkey(id, "src", f.storedAs));
    for (const o of t.outputs) await blobsDb.del(bkey(id, "out", o.path));
    await threadsDb.del(id);
  },
  removeFile: async (id, storedAs) => { const t = await localThread(id); t.files = t.files.filter((f) => f.storedAs !== storedAs); await blobsDb.del(bkey(id, "src", storedAs)); return saveLocal(t); },
  upload: async (id, file) => {
    const t = await localThread(id);
    const at = new Date().toISOString();
    let text: string | null = null;
    if (/\.(txt|md|markdown|csv|json|html?)$/i.test(file.name)) text = decodeText(new Uint8Array(await file.arrayBuffer()));
    else if (/\.(pdf|docx)$/i.test(file.name)) text = await extractFileText(file).catch(() => null);
    t.files = t.files.filter((f) => f.storedAs !== file.name);
    t.files.push({ name: file.name, storedAs: file.name, kind: "original", bytes: file.size, at });
    if (text != null) {
      const txt = file.name.replace(/\.[^.]+$/, "") + ".txt";
      await blobsDb.put(text, bkey(id, "src", txt === file.name ? file.name : txt));
      if (txt !== file.name) t.files.push({ name: file.name, storedAs: txt, kind: "text", bytes: text.length, at });
    }
    return saveLocal(t);
  },
  run: async (id, action, options) => {
    const thread = await localThread(id);
    return startApiRun({
      thread,
      readSource: (s) => blobsDb.get<string>(bkey(id, "src", s)).then((v) => v ?? null),
      readOutput: (p) => blobsDb.get<string>(bkey(id, "out", p)).then((v) => v ?? null),
      manuscript: () => blobsDb.get<Manuscript>(`${id}|ms`).then((v) => v ?? null),
      voice: () => blobsDb.get<string>("voice").then((v) => v ?? ""),
      record: async (r) => {
        const t = await localThread(id);
        const at = new Date().toISOString(); const jobId = crypto.randomUUID();
        if (r.userText) t.messages.push({ id: crypto.randomUUID(), role: "user", engine: "api", action: r.action, text: r.userText, at, jobId });
        for (const [p, text] of Object.entries(r.outputs)) {
          if (isBookResult(p)) await localRecord(id, p, "Earlier result");
          await blobsDb.put(text, bkey(id, "out", p));
          if (isBookResult(p)) await localRecord(id, p, `${r.action === "rewrite" ? "Rewrite" : r.action} (API)`);
          t.outputs = [{ path: p, bytes: text.length, modifiedAt: at }, ...t.outputs.filter((o) => o.path !== p)];
        }
        t.messages.push({ id: crypto.randomUUID(), role: "assistant", engine: "api", action: r.action, text: r.text, at, jobId, status: r.status, outputs: Object.keys(r.outputs) });
        await saveLocal(t);
      },
    }, action, options as RunOptions & Record<string, unknown>);
  },
  follow: (job, onEvent, signal) => followApiJob(job.id, onEvent, signal),
  output: async (id, p) => (await blobsDb.get<string>(bkey(id, "out", p))) ?? "",
  cancel: async (job) => cancelApiJob(job.id),
  source: async (id, s) => (await blobsDb.get<string>(bkey(id, "src", s))) ?? null,
  manuscript: async (id) => (await blobsDb.get<Manuscript>(`${id}|ms`)) ?? null,
  saveManuscript: async (id, m) => { const v = { ...m, updatedAt: new Date().toISOString() }; await blobsDb.put(v, `${id}|ms`); return v; },
  voice: async () => (await blobsDb.get<string>("voice")) ?? "",
  saveVoice: async (v) => blobsDb.put(v, "voice"),
  history: (id, p) => localHistory(id, p),
  version: async (id, p, n) => (await blobsDb.get<string>(`${id}|ver|${p}|${n}`)) ?? "",
  saveOutput: async (id, p, text, o) => {
    if (!isBookResult(p)) throw new Error("Only whole-book results keep versions.");
    const h0 = await localHistory(id, p);
    const latest = h0.versions.at(-1)?.n ?? 0;
    if (o.base != null && o.base !== latest) throw new Error(`A newer version (${latest}) was saved after the one you edited (${o.base}). Open the latest and apply your change there.`);
    await localRecord(id, p, "Earlier result");
    await blobsDb.put(text, bkey(id, "out", p));
    const t = await localThread(id);
    t.outputs = [{ path: p, bytes: text.length, modifiedAt: new Date().toISOString() }, ...t.outputs.filter((x) => x.path !== p)];
    await saveLocal(t);
    return localRecord(id, p, o.op, o.label);
  },
  approve: async (id, p, a) => {
    const h = await localHistory(id, p);
    if (!h.versions.length || a.version !== h.versions.at(-1)!.n) throw new Error("Only the latest saved version can be approved. Save your edits first.");
    if (a.summary.blockers > 0) throw new Error("Fix the problems that block publishing before approving.");
    h.approval = { version: a.version, at: new Date().toISOString(), by: null, summary: { ...a.summary, blockers: 0 } };
    await blobsDb.put(h, `${id}|hist|${p}`);
    return h;
  },
};
