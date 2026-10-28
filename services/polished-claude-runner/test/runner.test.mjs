import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createServer } from "../src/server.mjs";
import { loadConfig } from "../src/config.mjs";
import { claudeArgs, childEnv, settingsFor } from "../src/claude.mjs";
import { buildRun } from "../src/prompts.mjs";
import { inside, safeName } from "../src/store.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ADMIN = "2ac57576-0020-495f-95cc-e2dc42222153";
const OTHER = "11111111-1111-1111-1111-111111111111";
const TOKENS = { "t-admin": { id: ADMIN, admin: true }, "t-other": { id: OTHER, admin: true }, "t-listed-not-admin": { id: ADMIN, admin: false } };

let supa, server, base, dataDir;

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "runner-"));
  // A stand-in for Supabase Auth and the polished_is_admin RPC.
  supa = http.createServer((req, res) => {
    const tok = (req.headers.authorization || "").replace("Bearer ", "");
    const u = TOKENS[tok];
    if (req.url === "/auth/v1/user") { if (!u) { res.writeHead(401); return res.end("{}"); } res.writeHead(200); return res.end(JSON.stringify({ id: u.id, email: "owner@example.com" })); }
    if (req.url === "/rest/v1/rpc/polished_is_admin") { res.writeHead(200); return res.end(JSON.stringify(Boolean(u?.admin))); }
    res.writeHead(404); res.end();
  }).listen(0);
  await new Promise((r) => supa.on("listening", r));
  const cfg = loadConfig({
    DATA_DIR: dataDir, SUPABASE_URL: `http://127.0.0.1:${supa.address().port}`, SUPABASE_ANON_KEY: "anon",
    RUNNER_ADMIN_USER_IDS: ADMIN, ALLOWED_ORIGINS: "https://pages.example", CLAUDE_BIN: path.join(here, "fake-claude.mjs"),
    CLAUDE_CODE_OAUTH_TOKEN: "sk-ant-oat-test", JOB_TIMEOUT_MIN: "1",
  });
  server = createServer(cfg).listen(0);
  await new Promise((r) => server.on("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); supa.close(); });

const call = (p, { token = "t-admin", method = "GET", body, raw, headers = {} } = {}) =>
  fetch(base + p, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}), ...headers }, body: raw ?? (body ? JSON.stringify(body) : undefined) });

async function streamUntilDone(jobId, threadId) {
  const r = await call(`/v1/jobs/${jobId}/stream?thread=${threadId}`);
  const text = await r.text();
  return text.split("\n\n").filter((l) => l.startsWith("data: ")).map((l) => JSON.parse(l.slice(6)));
}

test("health needs no sign-in and reveals nothing", async () => {
  const r = await fetch(base + "/health");
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, level: 4 });
});

test("only the listed owner who is also a Polished Pages admin gets in", async () => {
  assert.equal((await call("/v1/me", { token: null })).status, 401);
  assert.equal((await call("/v1/me", { token: "bogus" })).status, 401);
  assert.equal((await call("/v1/me", { token: "t-other" })).status, 403, "an admin not on the runner's allowlist");
  assert.equal((await call("/v1/me", { token: "t-listed-not-admin" })).status, 403, "on the allowlist but no longer an admin");
  const me = await (await call("/v1/me")).json();
  assert.equal(me.user.id, ADMIN);
  assert.equal(me.claudeConnected, true);
  assert.equal(JSON.stringify(me).includes("sk-ant"), false, "the token is never returned");
});

test("CORS answers only the configured site", async () => {
  const ok = await fetch(base + "/v1/me", { method: "OPTIONS", headers: { Origin: "https://pages.example" } });
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://pages.example");
  const no = await fetch(base + "/v1/me", { method: "OPTIONS", headers: { Origin: "https://evil.example" } });
  assert.equal(no.headers.get("access-control-allow-origin"), null);
});

test("projects, uploads, summarise, rewrite with chapter merge, chat resume, outputs", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "My book" } })).json();
  assert.ok(thread.id);

  // a run needs a document
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "summarize" } })).status, 400);

  let r = await call(`/v1/threads/${thread.id}/files?name=${encodeURIComponent("../../evil Book.pdf")}&kind=original`, { method: "POST", raw: Buffer.from("%PDF-1.4 fake") });
  assert.equal(r.status, 201);
  r = await call(`/v1/threads/${thread.id}/files?name=${encodeURIComponent("evil Book.pdf")}&kind=text`, { method: "POST", raw: Buffer.from("Chapter one. Chapter two.") });
  const t2 = (await r.json()).thread;
  assert.deepEqual(t2.files.map((f) => f.storedAs).sort(), ["evil Book.pdf", "evil Book.txt"]);
  await fs.access(path.join(dataDir, "threads", thread.id, "work", "source", "evil Book.pdf"));

  // a plain-text original is not replaced by its "extracted" copy
  await call(`/v1/threads/${thread.id}/files?name=notes.txt&kind=original`, { method: "POST", raw: Buffer.from("plain notes") });
  const t3 = (await (await call(`/v1/threads/${thread.id}/files?name=notes.txt&kind=text`, { method: "POST", raw: Buffer.from("plain notes") })).json()).thread;
  assert.deepEqual(t3.files.filter((f) => f.storedAs === "notes.txt").map((f) => f.kind), ["original"]);

  // summarise
  let { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "summarize", options: { length: "brief" } } })).json();
  let events = await streamUntilDone(job.id, thread.id);
  assert.deepEqual(events.map((e) => e.type).filter((t) => t !== "status"), ["tool", "tool", "denied", "tool", "text", "done"]);
  assert.deepEqual(events.filter((e) => e.type === "tool").map((e) => e.line), ["Reading source/book.txt", "Searching the web: oslo capital", "Writing out/summary.md"]);
  assert.deepEqual(events.at(-1).outputs, ["summary.md"]);

  // what Claude Code was started with
  const callInfo = JSON.parse(await fs.readFile(path.join(dataDir, "threads", thread.id, "last-call.json"), "utf8"));
  assert.ok(callInfo.args.includes("--restricted"));
  assert.equal(callInfo.args[callInfo.args.indexOf("--permission-mode") + 1], "dontAsk");
  assert.equal(callInfo.args[callInfo.args.indexOf("--tools") + 1], "Read,Write,Edit,Glob,Grep,WebSearch,WebFetch,TodoWrite");
  assert.ok(callInfo.args.includes("--session-id"), "first run starts a named session");
  assert.equal(callInfo.env.CLAUDE_CODE_OAUTH_TOKEN, "sk-ant-oat-test");
  assert.equal(callInfo.env.ANTHROPIC_API_KEY, undefined);
  assert.equal(callInfo.env.SUPABASE_ANON_KEY, undefined, "the runner's own settings are not passed to Claude");
  assert.equal(callInfo.cwd, path.join(dataDir, "threads", thread.id, "work"));

  // rewrite: needs instructions; chapters merged into one book
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "rewrite", options: {} } })).status, 400);
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "rewrite", options: { instructions: "Modern English. Keep every verse reference.", addCitations: true, citationStyle: "SBL" } } })).json());
  events = await streamUntilDone(job.id, thread.id);
  assert.equal(events.at(-1).status, "done");
  const ins = await fs.readFile(path.join(dataDir, "threads", thread.id, "work", "INSTRUCTIONS.md"), "utf8");
  assert.match(ins, /Modern English\. Keep every verse reference\./);
  assert.match(ins, /SBL/);
  const book = await (await call(`/v1/threads/${thread.id}/outputs/rewrite.md`)).json();
  assert.match(book.text, /^## Beginnings[\s\S]*## The Journey[\s\S]*## Home[\s\S]*\n$/);
  assert.equal((book.text.match(/^## /gm) || []).length, 3);

  // chat resumes the same Claude session
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "chat", options: { message: "Thanks. Now shorten chapter two." } } })).json());
  await streamUntilDone(job.id, thread.id);
  const c3 = JSON.parse(await fs.readFile(path.join(dataDir, "threads", thread.id, "last-call.json"), "utf8"));
  assert.ok(c3.args.includes("--resume"));

  const full = (await (await call(`/v1/threads/${thread.id}`)).json()).thread;
  assert.equal(full.messages.length, 6);
  assert.ok(full.outputs.some((o) => o.path === "rewrite.md"));
  assert.ok(full.sessionId);

  // outputs cannot be read outside the project
  assert.equal((await call(`/v1/threads/${thread.id}/outputs/..%2F..%2Fthread.json`)).status, 404);
});

test("one run at a time: the next waits in the queue, a waiting job can be cancelled, a running job can be stopped", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Slow" } })).json();
  const { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "chat", options: { message: "SLOW please" } } })).json();
  const waiting = await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "chat", options: { message: "hello" } } });
  assert.equal(waiting.status, 202);
  const next = (await waiting.json()).job;
  assert.equal(next.status, "queued");
  const { job: dropped } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "chat", options: { message: "never mind" } } })).json();
  const droppedEvents = streamUntilDone(dropped.id, thread.id);
  assert.equal((await call(`/v1/jobs/${dropped.id}/cancel`, { method: "POST" })).status, 202);
  assert.equal((await droppedEvents).at(-1).status, "cancelled");
  assert.equal((await call(`/v1/threads/${thread.id}`, { method: "DELETE" })).status, 409);
  const nextEvents = streamUntilDone(next.id, thread.id);
  const pending = streamUntilDone(job.id, thread.id);
  assert.equal((await call(`/v1/jobs/${job.id}/cancel`, { method: "POST" })).status, 202);
  assert.equal((await pending).at(-1).status, "cancelled");
  const ev = await nextEvents;
  assert.ok(ev.some((e) => e.status === "queued"), "the waiting job said it was waiting");
  assert.equal(ev.at(-1).status, "done", "then it ran");
  assert.equal((await call(`/v1/threads/${thread.id}`, { method: "DELETE" })).status, 200);
});

test("book wizard: outline, chapters that see earlier chapters, improve", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Wizard" } })).json();
  // no upload needed for the wizard; a title is
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "book-outline", options: {} } })).status, 400);
  let { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "book-outline", options: { bookTitle: "Walking by Faith", genre: "Christian living", depth: "short", mode: "guided", knowledge: { rules: "Use the KJV.", terminology: "", forbidden: "slang" } } } })).json();
  assert.equal(job.output, "book/outline.json");
  let ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).status, "done");
  const brief = await fs.readFile(path.join(dataDir, "threads", thread.id, "work", "book", "BRIEF.md"), "utf8");
  assert.match(brief, /Use the KJV\./); assert.match(brief, /Forbidden: never use or mention\nslang/);
  const outline = JSON.parse((await (await call(`/v1/threads/${thread.id}/outputs/book/outline.json`)).json()).text);
  assert.equal(outline.title, "Walking by Faith");
  const chapters = outline.chapters.map((c) => ({ ...c, notes: "" }));
  for (const i of [0, 1]) {
    ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "book-chapter", options: { bookTitle: outline.title, depth: "short", chapters, chapterIndex: i } } })).json());
    ev = await streamUntilDone(job.id, thread.id);
    assert.equal(ev.at(-1).status, "done");
  }
  const ch2 = (await (await call(`/v1/threads/${thread.id}/outputs/book/chapters/02.md`)).json()).text;
  assert.match(ch2, /^## Part 2/); assert.match(ch2, /saw 1 earlier chapters/);
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "book-chapter", options: { chapters, chapterIndex: 9 } } })).status, 400);
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "book-improve", options: { content: ch2, improvementType: "tighten", chapterIndex: 1 } } })).json());
  ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).output, "book/improved/02-tighten.md");
  assert.match((await (await call(`/v1/threads/${thread.id}/outputs/book/improved/02-tighten.md`)).json()).text, /\(improved\)/);
  // approaches that build on the owner's book need it uploaded, and leave notes on what was used
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "book-chapter", options: { bookTitle: outline.title, chapters, chapterIndex: 0, approach: "mine-and-research" } } })).status, 400);
  await call(`/v1/threads/${thread.id}/files?name=my-book.txt&kind=original`, { method: "POST", raw: Buffer.from("My teaching on faith.") });
  for (const approach of ["polish", "mine-and-research"]) {
    ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "book-chapter", options: { bookTitle: outline.title, chapters, chapterIndex: 0, approach } } })).json());
    ev = await streamUntilDone(job.id, thread.id);
    assert.equal(ev.at(-1).status, "done");
    const notes = (await (await call(`/v1/threads/${thread.id}/outputs/book/chapters/01-notes.md`)).json()).text;
    assert.match(notes, /my-book\.txt/); assert.match(notes, new RegExp(`Approach: ${approach}$`));
  }
  // a step whose expected file never appears fails plainly
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "book-improve", options: { content: "FORGET", improvementType: "enhance", chapterIndex: 4 } } })).json());
  ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).status, "failed");
});

test("tools run on the uploads and write their named file", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Tools" } })).json();
  await call(`/v1/threads/${thread.id}/files?name=book.txt&kind=original`, { method: "POST", raw: Buffer.from("Some text to check.") });
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "nope" } } })).status, 400);
  const { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "quotes", translation: "KJV" } } })).json();
  assert.equal(job.label, "Verify quotations & scripture");
  assert.equal(job.output, "quotes-check.md");
  const ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).status, "done");
  const text = (await (await call(`/v1/threads/${thread.id}/outputs/quotes-check.md`)).json()).text;
  assert.match(text, /Verify every quotation and scripture/);
  // compare refuses paths outside the project
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "compare", a: "../../x", b: "source/book.txt" } } })).status, 400);
});

test("Claude Code status: signed out, usage limit with reset time, then ok again", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Status" } })).json();
  let { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "chat", options: { message: "AUTHFAIL" } } })).json();
  let ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).status, "failed"); assert.equal(ev.at(-1).errorKind, "auth");
  assert.equal((await (await call("/v1/me")).json()).claude.state, "signed_out");
  // "Check Claude Code again" re-tests the sign-in with a tiny run.
  assert.equal((await (await call("/v1/claude/check", { method: "POST" })).json()).claude.state, "ok");
  assert.equal((await (await call("/v1/me")).json()).claude.state, "ok");
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "chat", options: { message: "LIMITHIT" } } })).json());
  ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).errorKind, "limit");
  const me = (await (await call("/v1/me")).json()).claude;
  assert.equal(me.state, "limit"); assert.ok(Date.parse(me.resetsAt) > Date.now());
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "chat", options: { message: "hello" } } })).json());
  await streamUntilDone(job.id, thread.id);
  assert.equal((await (await call("/v1/me")).json()).claude.state, "ok");
  const t = (await (await call(`/v1/threads/${thread.id}`)).json()).thread;
  assert.ok(t.messages.filter((m) => m.role === "assistant").every((m) => m.engine === "claude-code"));
});

test("API results are recorded into the project, labelled as API", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "API" } })).json();
  await call(`/v1/threads/${thread.id}/files?name=doc.txt&kind=original`, { method: "POST", raw: Buffer.from("Source words.") });
  assert.equal((await (await call(`/v1/threads/${thread.id}/sources/doc.txt`)).json()).text, "Source words.");
  assert.equal((await call(`/v1/threads/${thread.id}/record`, { method: "POST", body: { outputs: { "../evil.md": "x" } } })).status, 400);
  assert.equal((await call(`/v1/threads/${thread.id}/record`, { method: "POST", body: { outputs: { "x.exe": "x" } } })).status, 400);
  const r = await call(`/v1/threads/${thread.id}/record`, { method: "POST", body: { action: "summarize", userText: "Summarise", text: "Done on the API.", outputs: { "summary.md": "# Summary\n\nShort." } } });
  const t = (await r.json()).thread;
  assert.deepEqual(t.messages.map((m) => [m.role, m.engine]), [["user", "api"], ["assistant", "api"]]);
  assert.ok(t.outputs.some((o) => o.path === "summary.md"));
});

test("manuscript: saved as JSON and mirrored as files; sections expanded; voice required for voice actions", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Book" } })).json();
  const manuscript = { title: "Walking by Faith", sections: [
    { id: "s-ded", kind: "dedication", title: "Dedication", body: "To my mother." },
    { id: "s-1", kind: "chapter", title: "The First Step", body: "Faith begins small." },
    { id: "../evil", kind: "chapter", title: "Two", body: "x" },
  ] };
  const saved = (await (await call(`/v1/threads/${thread.id}/manuscript`, { method: "PUT", body: { manuscript } })).json()).manuscript;
  assert.equal(saved.sections[2].id, "evil", "ids are sanitised");
  const work = path.join(dataDir, "threads", thread.id, "work", "manuscript");
  const files = (await fs.readdir(work)).sort();
  assert.deepEqual(files, ["01-dedication-dedication.md", "02-chapter-the-first-step.md", "03-chapter-two.md", "INDEX.md"]);
  assert.match(await fs.readFile(path.join(work, "INDEX.md"), "utf8"), /2\. 02-chapter-the-first-step\.md · chapter · The First Step/);
  assert.equal((await (await call(`/v1/threads/${thread.id}/manuscript`)).json()).manuscript.title, "Walking by Faith");

  // unknown section and unknown op are refused
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "nope", op: "expand" } } })).status, 400);
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-1", op: "dance" } } })).status, 400);

  let { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-1", op: "expand", factor: 2 } } })).json();
  assert.equal(job.output, "sections/s-1.md");
  let ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).status, "done");
  assert.equal((await (await call(`/v1/threads/${thread.id}/outputs/sections/s-1.md`)).json()).text, "Faith begins small. (expanded by Claude Code)");

  // guided rewrite: what the section says, then a rewrite with the owner's idea and the book's rules
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-1", op: "explain" } } })).json());
  assert.equal(job.output, "sections/s-1-summary.md");
  await streamUntilDone(job.id, thread.id);
  assert.equal((await (await call(`/v1/threads/${thread.id}/outputs/sections/s-1-summary.md`)).json()).text, "It says: Faith begins small.");
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-1", op: "rewrite", idea: "Start with Abraham", rules: "Write Yahuah instead of God" } } })).json());
  await streamUntilDone(job.id, thread.id);
  assert.equal((await (await call(`/v1/threads/${thread.id}/outputs/sections/s-1.md`)).json()).text, "Faith begins small. [rules: Write Yahuah instead of God]");
  // the guided fields are kept with the manuscript
  const guided = { ...manuscript, rules: "Write Yahuah instead of God", sections: manuscript.sections.map((x) => (x.id === "s-1" ? { ...x, summary: "It says…", idea: "Start with Abraham", original: "Faith begins small." } : x)) };
  const kept = (await (await call(`/v1/threads/${thread.id}/manuscript`, { method: "PUT", body: { manuscript: guided } })).json()).manuscript;
  assert.equal(kept.rules, "Write Yahuah instead of God");
  assert.deepEqual([kept.sections[1].summary, kept.sections[1].idea, kept.sections[1].original], ["It says…", "Start with Abraham", "Faith begins small."]);
  assert.equal(kept.sections[0].idea, undefined);

  // writing a section with an approach: needs the book uploaded, follows page notes, and leaves a note on what was used
  const withNotes = { ...guided, knowledge: { rules: "Use the KJV.", terminology: "", forbidden: "" }, meta: { isbn: "978-0-00" }, libraryId: "doc-1",
    sections: guided.sections.map((x) => (x.id === "s-1" ? { ...x, pageNotes: [{ page: "14", text: "Keep this sentence word for word." }, { page: "15", text: "  " }] } : x)) };
  const keptNotes = (await (await call(`/v1/threads/${thread.id}/manuscript`, { method: "PUT", body: { manuscript: withNotes } })).json()).manuscript;
  assert.deepEqual(keptNotes.sections[1].pageNotes, [{ page: "14", text: "Keep this sentence word for word." }], "empty page notes are dropped");
  assert.deepEqual([keptNotes.knowledge.rules, keptNotes.meta.isbn, keptNotes.libraryId], ["Use the KJV.", "978-0-00", "doc-1"]);
  // version history is kept with each section, cleaned and capped
  const withVersions = { ...withNotes, sections: withNotes.sections.map((x) => (x.id === "s-1" ? { ...x, versions: [
    ...Array.from({ length: 45 }, (_, i) => ({ id: `v-${i}`, at: "2026-10-27T10:00:00Z", kind: "autosave", title: "One", body: `draft ${i}` })),
    { id: "v-../bad", at: "2026-10-27T11:00:00Z", kind: "weird", title: "One", body: "named", label: "Sent to editor" },
  ] } : x)) };
  const keptVersions = (await (await call(`/v1/threads/${thread.id}/manuscript`, { method: "PUT", body: { manuscript: withVersions } })).json()).manuscript.sections[1].versions;
  assert.equal(keptVersions.length, 40);
  assert.deepEqual(keptVersions.at(-1), { id: "v-bad", at: "2026-10-27T11:00:00Z", kind: "snapshot", title: "One", body: "named", label: "Sent to editor" });
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-1", op: "compose", approach: "mine-and-research" } } })).status, 400, "the book must be uploaded first");
  await call(`/v1/threads/${thread.id}/files?name=demonology.txt&kind=original`, { method: "POST", raw: Buffer.from("My teaching on spirits.") });
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-1", op: "compose", approach: "mine-and-research" } } })).json());
  assert.equal(job.output, "sections/s-1.md");
  assert.equal((await streamUntilDone(job.id, thread.id)).at(-1).status, "done");
  const used = (await (await call(`/v1/threads/${thread.id}/outputs/sections/s-1-notes.md`)).json()).text;
  assert.match(used, /demonology\.txt/); assert.match(used, /Page 14: Keep this sentence word for word\./);
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-1", op: "improve", improvementType: "tighten" } } })).json());
  await streamUntilDone(job.id, thread.id);
  assert.match((await (await call(`/v1/threads/${thread.id}/outputs/sections/s-1.md`)).json()).text, /\(improved\)$/);

  // voice actions need a saved voice profile
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-1", op: "voice" } } })).status, 400);
  assert.equal((await call("/v1/voice", { method: "PUT", body: { voice: "# Voice\n\nShort sentences. Warm." } })).status, 200);
  assert.match((await (await call("/v1/voice")).json()).voice, /Short sentences/);
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-1", op: "voice" } } })).json());
  ev = await streamUntilDone(job.id, thread.id);
  assert.match((await (await call(`/v1/threads/${thread.id}/outputs/sections/s-1.md`)).json()).text, /\[voice used\]/);
  // voice tools
  await call(`/v1/threads/${thread.id}/files?name=sample.txt&kind=original`, { method: "POST", raw: Buffer.from("My own words.") });
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "voice-profile" } } })).json());
  ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).output, "voice-profile.md"); assert.equal(ev.at(-1).status, "done");
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "voice" } } })).json());
  ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).status, "done");
});

test("turn into a series: volumes, planned books and a machine-readable plan", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Series" } })).json();
  await call(`/v1/threads/${thread.id}/files?name=book.txt&kind=original`, { method: "POST", raw: Buffer.from("## One\n\nFirst.\n\n## Two\n\nSecond.") });
  const { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "series", mode: "both" } } })).json();
  assert.equal(job.label, "Turn into a series");
  const ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).status, "done");
  const plan = JSON.parse((await (await call(`/v1/threads/${thread.id}/outputs/series.json`)).json()).text);
  assert.equal(plan.volumes.length, 2); assert.equal(plan.planned.length, 1);
  assert.match((await (await call(`/v1/threads/${thread.id}/outputs/${plan.volumes[1].file}`)).json()).text, /^# The Road/);
});

test("cover copy: written from book text sent with the request, no upload needed", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Book covers" } })).json();
  const { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "cover-copy", title: "The Long Road", text: "# The Long Road\n\n## One\n\nFirst." } } })).json();
  assert.equal(job.label, "Cover copy");
  assert.equal(job.output, "cover-copy.json");
  const ev = await streamUntilDone(job.id, thread.id);
  assert.equal(ev.at(-1).status, "done");
  const copy = JSON.parse((await (await call(`/v1/threads/${thread.id}/outputs/cover-copy.json`)).json()).text);
  assert.equal(copy.template, "devotional");
  assert.match(copy.blurb, /The Long Road/);
  // Without text (and without uploads) it still needs a document.
  const r = await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "cover-copy" } } });
  assert.equal(r.status, 400);
});

test("the Claude Code token is cleaned up from however it was pasted", async () => {
  const { cleanToken, tokenShape } = await import("../src/config.mjs");
  const tok = "sk-ant-oat01-" + "A1b2_C3d4-".repeat(8);
  assert.equal(cleanToken(tok), tok);
  assert.equal(cleanToken(`  "${tok}"\n`), tok);
  assert.equal(cleanToken(`CLAUDE_CODE_OAUTH_TOKEN=${tok}`), tok);
  assert.equal(cleanToken(`${tok.slice(0, 30)}\n${tok.slice(30)}`), tok); // wrapped by the terminal
  assert.equal(cleanToken(`Your OAuth token (valid for 1 year):\n\n${tok}\n\nStore this token securely.`), tok);
  assert.equal(tokenShape(tok), "subscription");
  assert.equal(tokenShape("sk-ant-api03-xyz"), "api-key");
  assert.equal(tokenShape("your-token-here"), "unrecognised");
  assert.equal(tokenShape(""), "missing");
});

test("the sandbox settings and helpers", () => {
  const s = settingsFor("/data/threads/x/work");
  assert.ok(s.permissions.deny.includes("Read(//etc/**)"));
  assert.ok(s.permissions.deny.includes("Write(./source/**)"));
  // a wall that would cover the work folder itself is left out
  assert.equal(settingsFor("/home/u/data/threads/x/work").permissions.deny.includes("Read(//home/**)"), false);
  const env = childEnv({ claudeToken: "tok" }, "/data/home");
  assert.deepEqual(Object.keys(env).sort(), ["CLAUDE_CODE_OAUTH_TOKEN", "CLAUDE_CODE_WEB_SEARCH_REFILLS_PER_HOUR", "DISABLE_AUTOUPDATER", "DISABLE_TELEMETRY", "HOME", "LANG", "PATH"]);
  assert.ok(claudeArgs({ prompt: "x", resume: "abc", cwd: "/w" }).includes("--resume"));
  assert.equal(inside("/a/b", "../c"), null);
  assert.equal(inside("/a/b", "c/d.md"), "/a/b/c/d.md");
  assert.equal(safeName("../../x/../.hidden.md"), "hidden.md");
  assert.equal(buildRun("nope"), null);
  assert.match(buildRun("cite", { citationStyle: "MLA 9" }).instructions, /MLA 9/);
});

test("whole-book rewrite runs in editorial stages under the faithfulness standard", () => {
  const r = buildRun("rewrite", { instructions: "Academic register." });
  // the standard is in ./INSTRUCTIONS.md, which Claude re-reads for every chapter
  for (const rule of ["Rewrite, do not copy", "Keep the author's level of certainty", "Never leave [citation needed]", "every number is used once", "Front matter (description, contents, course schedule, learning outcomes) must match the book", "Sensitive claims for the author"]) assert.ok(r.instructions.includes(rule), rule);
  // the stages: analysis, plan, chapter-by-chapter rewrite, assembly, audit with targeted correction, notes
  for (const step of ["rewrite-analysis.md", "rewrite-plan.md", "./out/rewrite/NN-short-title.md", "./out/rewrite.md", "Editorial audit and targeted correction", "### Promised but missing", "### Claims that need a source"]) assert.ok(r.prompt.includes(step), step);
  // a section rewrite carries the same standard without asking for a notes file
  const s = buildRun("section", { op: "rewrite", sectionId: "s1", _file: "01-a.md" });
  assert.ok(s.prompt.includes("never dropping a qualification") && s.prompt.includes("Rewrite, do not copy") && s.prompt.includes("Never write [citation needed]"));
  assert.ok(!s.prompt.includes("in the notes"));
});

test("a targeted correction fixes the listed problems only and writes a separate corrected book", () => {
  const r = buildRun("rewrite", { correct: true, target: "rewrite.md", instructions: "- Two headings share the number 20" });
  assert.ok(r.instructions.includes("Two headings share the number 20") && r.instructions.includes("Fix only the problems listed"));
  assert.ok(r.prompt.startsWith("Correct the file ./out/rewrite.md") && r.prompt.includes("./out/corrected.md") && r.prompt.includes("./out/corrected-notes.md"));
  assert.ok(!r.prompt.includes("rewrite-analysis.md"));
});

test("book results keep numbered versions, refuse a save over a newer version, and record the owner's approval", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Versions" } })).json();
  const rec = (text) => call(`/v1/threads/${thread.id}/record`, { method: "POST", body: { action: "rewrite", label: "Rewrite", text: "done", outputs: { "rewrite.md": text } } });
  await rec("# Book\n\nFirst rewrite.");
  await rec("# Book\n\nSecond rewrite.");
  let h = (await (await call(`/v1/threads/${thread.id}/history/rewrite.md`)).json()).history;
  assert.deepEqual(h.versions.map((v) => [v.n, v.op]), [[1, "Rewrite (API)"], [2, "Rewrite (API)"]]);
  // the first rewrite is still readable
  assert.equal((await (await call(`/v1/threads/${thread.id}/history/rewrite.md?n=1`)).json()).text, "# Book\n\nFirst rewrite.");
  // a save based on an older version is refused, so newer work is never overwritten
  const stale = await call(`/v1/threads/${thread.id}/outputs/rewrite.md`, { method: "PUT", body: { text: "# Book\n\nEdited.", base: 1 } });
  assert.equal(stale.status, 409);
  const ok = await call(`/v1/threads/${thread.id}/outputs/rewrite.md`, { method: "PUT", body: { text: "# Book\n\nEdited.", base: 2, op: "Edited by the owner" } });
  h = (await ok.json()).history;
  assert.deepEqual(h.versions.map((v) => v.n), [1, 2, 3]);
  assert.equal((await (await call(`/v1/threads/${thread.id}/outputs/rewrite.md`)).json()).text, "# Book\n\nEdited.");
  // only whole-book results are versioned this way
  assert.equal((await call(`/v1/threads/${thread.id}/outputs/summary.md`, { method: "PUT", body: { text: "x" } })).status, 400);
  // approval: latest version only, never with blockers, recorded with who and when
  assert.equal((await call(`/v1/threads/${thread.id}/approve/rewrite.md`, { method: "POST", body: { version: 2, summary: { blockers: 0 } } })).status, 409);
  assert.equal((await call(`/v1/threads/${thread.id}/approve/rewrite.md`, { method: "POST", body: { version: 3, summary: { blockers: 2 } } })).status, 400);
  h = (await (await call(`/v1/threads/${thread.id}/approve/rewrite.md`, { method: "POST", body: { version: 3, summary: { blockers: 0, reviews: 2, decided: 2, checks: ["structure"] } } })).json()).history;
  assert.equal(h.approval.version, 3);
  assert.equal(h.approval.by, "owner@example.com");
  // a new version leaves the approval on the old one, so the app shows it as lapsed
  await rec("# Book\n\nThird rewrite.");
  h = (await (await call(`/v1/threads/${thread.id}/history/rewrite.md`)).json()).history;
  assert.equal(h.versions.at(-1).n, 4);
  assert.equal(h.approval.version, 3);
});

test("rebuild as a professional book: a design from the whole material, then chapters that read the manuscript it replaced", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Rebuild" } })).json();
  // Nothing to design from yet.
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "book-design", bookType: "course" } } })).status, 400);
  await call(`/v1/threads/${thread.id}/files?name=demonology.txt&kind=original`, { method: "POST", raw: Buffer.from("My teaching on spirits.") });
  await call(`/v1/threads/${thread.id}/manuscript`, { method: "PUT", body: { manuscript: { title: "Demonology I", rules: "Write Yahusha instead of Jesus", sections: [{ id: "s-1", kind: "chapter", title: "Old", body: "The author's latest text." }] } } });
  let { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "book-design", bookType: "course", instructions: "A university course", approach: "mine" } } })).json();
  assert.equal(job.output, "book-design.json");
  assert.equal(job.label, "Design the professional book");
  assert.equal((await streamUntilDone(job.id, thread.id)).at(-1).status, "done");
  const design = JSON.parse((await (await call(`/v1/threads/${thread.id}/outputs/book-design.json`)).json()).text);
  assert.equal(design.rationale, "A course.");
  assert.equal(design.sections[1].draws, "the manuscript", "the design reads the manuscript as well as the uploads");
  const last = JSON.parse(await fs.readFile(path.join(dataDir, "threads", thread.id, "last-call.json"), "utf8"));
  const prompt = last.args[last.args.indexOf("-p") + 1];
  assert.match(prompt, /Write Yahusha instead of Jesus/);
  assert.match(prompt, /A university course/);

  // The design applied: empty designed sections, the brief, and the replaced manuscript kept.
  const rebuilt = { title: "Demonology I", rules: "Write Yahusha instead of Jesus", design: { bookType: "course", instructions: "A university course", approach: "mine", at: "2026-10-27T10:00:00Z", extra: "dropped" },
    archive: [{ at: "2026-10-27T10:00:00Z", label: "Before the rebuild", sections: [{ id: "s-1", kind: "chapter", title: "Old", body: "The author's latest text.", versions: [{ id: "v" }] }] }],
    sections: [{ id: "s-a", kind: "chapter", title: "One", body: "", idea: "First.\nDraws on: the manuscript" }] };
  const kept = (await (await call(`/v1/threads/${thread.id}/manuscript`, { method: "PUT", body: { manuscript: rebuilt } })).json()).manuscript;
  assert.deepEqual(kept.design, { bookType: "course", instructions: "A university course", approach: "mine", at: "2026-10-27T10:00:00Z" });
  assert.deepEqual(kept.archive[0].sections[0], { id: "s-1", kind: "chapter", title: "Old", body: "The author's latest text." });
  const before = await fs.readFile(path.join(dataDir, "threads", thread.id, "work", "manuscript", "BEFORE-REBUILD.md"), "utf8");
  assert.match(before, /## Old\n\nThe author's latest text\./);
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "section", options: { sectionId: "s-a", op: "compose", approach: "mine" } } })).json());
  assert.equal((await streamUntilDone(job.id, thread.id)).at(-1).status, "done");
  const call2 = JSON.parse(await fs.readFile(path.join(dataDir, "threads", thread.id, "last-call.json"), "utf8"));
  const p2 = call2.args[call2.args.indexOf("-p") + 1];
  assert.match(p2, /BEFORE-REBUILD\.md/);
  assert.match(p2, /rebuilt as a professional book/);
  assert.match(p2, /Course textbook/);
  assert.match(p2, /never pad/);
});

test("Finish's tools work on the manuscript as it stands, not only on the upload", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Finish tools" } })).json();
  await call(`/v1/threads/${thread.id}/files?name=book.txt&kind=original`, { method: "POST", raw: Buffer.from("The original.") });
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "marketing", target: "manuscript" } } })).status, 400, "an empty manuscript is refused");
  await call(`/v1/threads/${thread.id}/manuscript`, { method: "PUT", body: { manuscript: { title: "Rebuilt", sections: [{ id: "s-1", kind: "chapter", title: "One", body: "The rebuilt chapter." }] } } });
  const { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "marketing", target: "manuscript" } } })).json();
  assert.equal(job.output, "marketing-pack.md");
  await streamUntilDone(job.id, thread.id);
  const last = JSON.parse(await fs.readFile(path.join(dataDir, "threads", thread.id, "last-call.json"), "utf8"));
  assert.match(last.args[last.args.indexOf("-p") + 1], /the book's manuscript in \.\/manuscript\//);
});

test("Claude on a Library book runs on Claude Code with the text sent along, no upload needed", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Library corrections" } })).json();
  let { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "library-revise", title: "Demonology I", text: "### Introduction\n\nMany Christians has no understanding.", instructions: "Correct the English", rules: "Write Yahusha instead of Jesus" } } })).json();
  assert.equal(job.output, "library/revised.md");
  await streamUntilDone(job.id, thread.id);
  let last = JSON.parse(await fs.readFile(path.join(dataDir, "threads", thread.id, "last-call.json"), "utf8"));
  let prompt = last.args[last.args.indexOf("-p") + 1];
  assert.match(prompt, /Correct the English/);
  assert.match(prompt, /Write Yahusha instead of Jesus/);
  assert.equal(await fs.readFile(path.join(dataDir, "threads", thread.id, "work", "library", "passage.md"), "utf8"), "### Introduction\n\nMany Christians has no understanding.");
  ({ job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "library-ask", title: "Demonology I", text: "# Demonology I\n\nText.", message: "Where does it repeat itself?" } } })).json());
  assert.equal(job.output, "library/answer.md");
  await streamUntilDone(job.id, thread.id);
  last = JSON.parse(await fs.readFile(path.join(dataDir, "threads", thread.id, "last-call.json"), "utf8"));
  assert.match(last.args[last.args.indexOf("-p") + 1], /Where does it repeat itself\?/);
  // Without text it still needs a document.
  assert.equal((await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "library-ask", message: "x" } } })).status, 400);
});

test("read scanned pages: the transcription becomes the scanned document's text", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Scanned" } })).json();
  await call(`/v1/threads/${thread.id}/files?name=onenessofgod.pdf&kind=original`, { method: "POST", raw: Buffer.from("%PDF-1.4 scanned images only") });
  const { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "ocr" } } })).json();
  assert.equal(job.output, "scanned-text.md");
  assert.equal((await streamUntilDone(job.id, thread.id)).at(-1).status, "done");
  const t = (await (await call(`/v1/threads/${thread.id}`)).json()).thread;
  const copy = t.files.find((f) => f.kind === "text" && f.storedAs === "onenessofgod.txt");
  assert.ok(copy, "the scanned PDF now has its text copy");
  assert.match(await fs.readFile(path.join(dataDir, "threads", thread.id, "work", "source", "onenessofgod.txt"), "utf8"), /oneness of God/);
});

test("a password-protected PDF: the Studio's page images are stored with it, read by Claude, and removed with it", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Locked" } })).json();
  await call(`/v1/threads/${thread.id}/files?name=onenessofgod.pdf&kind=original`, { method: "POST", raw: Buffer.from("%PDF-1.4 encrypted") });
  const raw = await call(`/v1/threads/${thread.id}/files/onenessofgod.pdf`);
  assert.equal(raw.status, 200);
  assert.equal(Buffer.from(await raw.arrayBuffer()).toString(), "%PDF-1.4 encrypted");
  let t = (await (await call(`/v1/threads/${thread.id}/files?name=onenessofgod-p001.jpg&kind=page`, { method: "POST", raw: Buffer.from("jpeg") })).json()).thread;
  assert.equal(t.files.find((f) => f.storedAs === "onenessofgod-p001.jpg").kind, "page");
  const run = buildRun("tool", { tool: "ocr" });
  assert.match(run.prompt, /-p001\.jpg/);
  t = (await (await call(`/v1/threads/${thread.id}/files/onenessofgod.pdf`, { method: "DELETE" })).json()).thread;
  assert.equal(t.files.length, 0, "the page images go with their PDF");
});

test("a report that a PDF could not be opened is never taken as its text", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Locked report" } })).json();
  await call(`/v1/threads/${thread.id}/files?name=locked.pdf&kind=original`, { method: "POST", raw: Buffer.from("%PDF-1.4 encrypted") });
  const { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "ocr" } } })).json();
  await streamUntilDone(job.id, thread.id);
  const t = (await (await call(`/v1/threads/${thread.id}`)).json()).thread;
  assert.equal(t.files.some((f) => f.kind === "text"), false, "the locked PDF still has no text");
  // Removing a text copy keeps the page images of its PDF.
  await call(`/v1/threads/${thread.id}/files?name=locked-p001.jpg&kind=page`, { method: "POST", raw: Buffer.from("jpeg") });
  await call(`/v1/threads/${thread.id}/files?name=locked.pdf&kind=text`, { method: "POST", raw: Buffer.from("x") });
  const after = (await (await call(`/v1/threads/${thread.id}/files/locked.txt`, { method: "DELETE" })).json()).thread;
  assert.ok(after.files.some((f) => f.storedAs === "locked-p001.jpg"));
});

test("a large save may arrive gzipped and is read the same", async () => {
  const { gzipSync } = await import("node:zlib");
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Big" } })).json();
  const manuscript = { title: "Big book", sections: [{ id: "s-1", kind: "chapter", title: "One", body: "word ".repeat(200_000) }] };
  const r = await call(`/v1/threads/${thread.id}/manuscript`, { method: "PUT", raw: gzipSync(Buffer.from(JSON.stringify({ manuscript }))), headers: { "Content-Encoding": "gzip", "Content-Type": "application/json" } });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).manuscript.sections[0].body.length, 1_000_000);
  const bad = await call(`/v1/threads/${thread.id}/manuscript`, { method: "PUT", raw: Buffer.from("not gzip"), headers: { "Content-Encoding": "gzip" } });
  assert.equal(bad.status, 400);
});

test("the rewrite control panel: plan first for approval, then the rewrite from the approved plan; or an audit only", () => {
  const plan = buildRun("rewrite", { instructions: "Complete Book Transformation", approval: true });
  assert.equal(plan.output, "rewrite-plan.md");
  assert.match(plan.prompt, /stop for the owner's approval/);
  assert.doesNotMatch(plan.prompt, /\.\/out\/rewrite\.md/);
  const go = buildRun("rewrite", { instructions: "Complete Book Transformation", approval: true, planApproved: true });
  assert.equal(go.output, "rewrite.md");
  assert.match(go.prompt, /approved the editorial plan in \.\/out\/rewrite-plan\.md/);
  const audit = buildRun("rewrite", { instructions: "Scripture audit", auditOnly: true });
  assert.equal(audit.output, "rewrite-audit.md");
  assert.match(audit.prompt, /do not write \.\/out\/rewrite\.md/);
  assert.match(audit.instructions, /Scripture audit/);
});

test("the runner says what it can do, so the Studio can tell an old runner", async () => {
  const me = await (await call("/v1/me")).json();
  assert.equal(me.runner.level, 4);
  assert.ok(me.runner.features.includes("organise"));
  assert.equal(typeof me.runner.poppler, "boolean");
});

test("a long scan is read in batches of pages, each batch queuing the next, and the text grows as it goes", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Long scan" } })).json();
  await call(`/v1/threads/${thread.id}/files?name=bigscan.pdf&kind=original`, { method: "POST", raw: Buffer.from("%PDF-1.4\n" + "<< /Type /Page >>\n".repeat(45) + "<< /Type /Pages >>") });
  let { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "ocr" } } })).json();
  assert.equal(job.output, "scanned/bigscan.txt");
  const labels = [job.label];
  for (;;) {
    const done = (await streamUntilDone(job.id, thread.id)).at(-1);
    assert.equal(done.status, "done");
    if (!done.next) break;
    job = done.next; labels.push(job.label);
  }
  assert.deepEqual(labels, ["Read scanned pages · bigscan.pdf · pages 1–20 of 45", "Read scanned pages · bigscan.pdf · pages 21–40 of 45", "Read scanned pages · bigscan.pdf · pages 41–45 of 45"]);
  const text = await fs.readFile(path.join(dataDir, "threads", thread.id, "work", "source", "bigscan.txt"), "utf8");
  assert.match(text, /Page 1 of/); assert.match(text, /Page 45 of/);
  assert.doesNotMatch(text, /<!-- page/, "the page markers stay out of the document's text");
  const again = await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "tool", options: { tool: "ocr", continueRun: true } } });
  assert.equal(again.status, 400, "nothing left to continue");
});

test("a rewrite that stopped can be continued: finished chapters are kept and the book is completed", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Stopped rewrite" } })).json();
  await call(`/v1/threads/${thread.id}/files?name=book.txt&kind=original`, { method: "POST", raw: Buffer.from("# The Long Road\n\nOne. Two. Three.") });
  const { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "rewrite", options: { instructions: "STOPAFTERTWO make it modern" } } })).json();
  assert.equal((await streamUntilDone(job.id, thread.id)).at(-1).status, "failed");
  let t = (await (await call(`/v1/threads/${thread.id}`)).json()).thread;
  const resume = t.messages.at(-1).resume;
  assert.deepEqual(resume, { action: "rewrite", options: { continueRun: true }, what: "2 chapters written" });
  const work = path.join(dataDir, "threads", thread.id, "work");
  const instructions = await fs.readFile(path.join(work, "INSTRUCTIONS.md"), "utf8");
  const next = (await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "rewrite", options: resume.options } })).json()).job;
  assert.equal(next.label, "Rewrite · continued");
  assert.equal((await streamUntilDone(next.id, thread.id)).at(-1).status, "done");
  assert.equal(await fs.readFile(path.join(work, "INSTRUCTIONS.md"), "utf8"), instructions, "the stopped run's instructions are kept");
  const book = await fs.readFile(path.join(work, "out", "rewrite.md"), "utf8");
  assert.match(book, /Beginnings[\s\S]*Journey[\s\S]*Home/);
  t = (await (await call(`/v1/threads/${thread.id}`)).json()).thread;
  assert.equal(t.messages.at(-1).resume, null);
  const run = buildRun("rewrite", { continueRun: true, _done: [{ name: "01-a.md", words: 900 }] });
  assert.match(run.prompt, /01-a\.md \(900 words\)/);
  assert.match(run.prompt, /Do not rewrite chapters that are complete/);
});


test("the plan waiting for approval can be changed by the owner; Claude's first plan is kept", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Plan" } })).json();
  const out = path.join(dataDir, "threads", thread.id, "work", "out");
  await fs.mkdir(out, { recursive: true });
  await fs.writeFile(path.join(out, "rewrite-plan.md"), "# Plan\n\n1. One.");
  const r = await call(`/v1/threads/${thread.id}/outputs/rewrite-plan.md`, { method: "PUT", body: { text: "# Plan\n\n1. One, renamed." } });
  assert.equal(r.status, 200);
  await call(`/v1/threads/${thread.id}/outputs/rewrite-plan.md`, { method: "PUT", body: { text: "# Plan\n\n1. Third try." } });
  assert.equal(await fs.readFile(path.join(out, "rewrite-plan.md"), "utf8"), "# Plan\n\n1. Third try.");
  assert.equal(await fs.readFile(path.join(out, "rewrite-plan.claude.md"), "utf8"), "# Plan\n\n1. One.", "Claude's own proposal stays as it was");
  assert.match(buildRun("rewrite", { instructions: "x", approval: true, planApproved: true }).prompt, /the owner's version decides/);
});
