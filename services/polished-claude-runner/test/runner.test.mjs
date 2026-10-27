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
  assert.deepEqual(await r.json(), { ok: true });
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

test("one run at a time, and a running job can be stopped", async () => {
  const { thread } = await (await call("/v1/threads", { method: "POST", body: { title: "Slow" } })).json();
  const { job } = await (await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "chat", options: { message: "SLOW please" } } })).json();
  const busy = await call(`/v1/threads/${thread.id}/run`, { method: "POST", body: { action: "chat", options: { message: "hello" } } });
  assert.equal(busy.status, 409);
  assert.equal((await call(`/v1/threads/${thread.id}`, { method: "DELETE" })).status, 409);
  const pending = streamUntilDone(job.id, thread.id);
  assert.equal((await call(`/v1/jobs/${job.id}/cancel`, { method: "POST" })).status, 202);
  const events = await pending;
  assert.equal(events.at(-1).status, "cancelled");
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
