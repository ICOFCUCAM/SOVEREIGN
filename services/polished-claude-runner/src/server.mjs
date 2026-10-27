import http from "node:http";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadConfig, configProblems, tokenShape } from "./config.mjs";

// What to do about the token, by what kind of value the runner holds.
const FIX = "On a computer signed in to your Claude subscription run `claude setup-token`, paste the whole token it prints (one line, starting sk-ant-oat01-) as CLAUDE_CODE_OAUTH_TOKEN on the runner, then redeploy the runner.";
const TOKEN_HELP = {
  missing: `CLAUDE_CODE_OAUTH_TOKEN is not set. ${FIX}`,
  "api-key": `CLAUDE_CODE_OAUTH_TOKEN holds an API key (sk-ant-api…), not a subscription token. ${FIX}`,
  unrecognised: `CLAUDE_CODE_OAUTH_TOKEN doesn't look like a subscription token. ${FIX}`,
  subscription: `The subscription token was refused (expired, revoked or mistyped). ${FIX}`,
};
import { createAuth } from "./auth.mjs";
import { createStore, safeName, inside, isBookResult, manuscriptFile } from "./store.mjs";
import { USES_BOOK, buildRun, CITATION_STYLES } from "./prompts.mjs";
import { runClaude } from "./claude.mjs";

// Claude Studio runner. A small HTTP API in front of the owner's Claude Code:
//   GET    /health                          liveness (no data)
//   GET    /v1/me                           who you are, whether the runner is ready
//   POST   /v1/claude/check                 a tiny Claude Code run, to re-test the sign-in
//   GET    /v1/threads                      projects
//   POST   /v1/threads                      {title} → new project
//   GET    /v1/threads/:id                  project with messages, files, outputs, running job
//   PATCH  /v1/threads/:id                  {title}
//   DELETE /v1/threads/:id
//   POST   /v1/threads/:id/files?name=&kind=original|text   raw body upload
//   DELETE /v1/threads/:id/files/:storedAs
//   POST   /v1/threads/:id/run              {action: chat|summarize|rewrite|cite, options}
//   GET    /v1/threads/:id/outputs/<path>   a file Claude wrote (text)
//   PUT    /v1/threads/:id/outputs/<path>   {text, op, label, base} save a new version of a book result (409 if newer exists)
//   GET    /v1/threads/:id/history/<path>   versions of a book result and its approval; ?n= one version's text
//   POST   /v1/threads/:id/approve/<path>   {version, summary} approve the current version as publication-ready
//   GET    /v1/jobs/:id/stream              server-sent events: replay + live
//   POST   /v1/jobs/:id/cancel
// One run at a time: this is one person's Claude plan, not a shared service.
const ACTIONS = new Set(["chat", "summarize", "rewrite", "cite", "tool", "section", "book-outline", "book-chapter", "book-improve"]);
const LABEL = { chat: "Chat", summarize: "Summarise", rewrite: "Rewrite", cite: "Citations & references", "book-outline": "Book wizard · outline", "book-chapter": "Book wizard · chapter", "book-improve": "Book wizard · improve" };

export function createServer(cfg = loadConfig(), deps = {}) {
  const auth = deps.auth || createAuth(cfg, deps.fetch);
  const store = createStore(cfg.dataDir);
  const home = path.join(cfg.dataDir, "home");
  const jobs = new Map(); // id → job (kept in memory for streaming; logs on disk)
  let running = null;

  // Whether the owner's Claude Code worked last time: the page's engine switch
  // reads this to decide between Claude Code and the API.
  const statusFile = path.join(cfg.dataDir, "claude-status.json");
  // The saved status belongs to the token it was learned with: after the token
  // is replaced (and the runner redeployed), an old "signed out" no longer applies.
  const tokenId = cfg.claudeToken ? createHash("sha256").update(cfg.claudeToken).digest("hex").slice(0, 16) : "";
  let claudeStatus = { state: "unknown", at: null, resetsAt: null, message: null };
  fs.readFile(statusFile, "utf8").then((t) => { const saved = JSON.parse(t); if (saved.tokenId === tokenId) claudeStatus = { ...claudeStatus, ...saved }; }).catch(() => {});
  const setStatus = (st) => {
    claudeStatus = { state: st.state, at: new Date().toISOString(), resetsAt: st.resetsAt ?? null, message: st.message ?? null, tokenId };
    fs.mkdir(cfg.dataDir, { recursive: true }).then(() => fs.writeFile(statusFile, JSON.stringify(claudeStatus))).catch(() => {});
  };
  const currentStatus = () => {
    if (!cfg.claudeToken) return { state: "not_configured", at: null, resetsAt: null, message: TOKEN_HELP.missing };
    if (tokenShape(cfg.claudeToken) === "api-key") return { state: "signed_out", at: null, resetsAt: null, message: TOKEN_HELP["api-key"] };
    // A usage limit lifts on its own at its reset time.
    if (claudeStatus.state === "limit" && claudeStatus.resetsAt && Date.parse(claudeStatus.resetsAt) < Date.now()) return { ...claudeStatus, state: "unknown" };
    const { tokenId: _id, ...pub } = claudeStatus;
    return pub;
  };

  const cors = (req, res) => {
    const origin = req.headers.origin;
    if (origin && cfg.allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Max-Age", "600");
    }
  };
  const send = (res, status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(JSON.stringify(body));
  };
  const fail = (res, status, error) => send(res, status, { error });

  async function body(req, limit) {
    const chunks = []; let n = 0;
    for await (const c of req) { n += c.length; if (n > limit) throw Object.assign(new Error("too large"), { status: 413 }); chunks.push(c); }
    return Buffer.concat(chunks);
  }
  const json = async (req) => { const b = await body(req, 1024 * 1024); try { return b.length ? JSON.parse(b.toString("utf8")) : {}; } catch { throw Object.assign(new Error("bad json"), { status: 400 }); } };

  function publicJob(j) {
    return j && { id: j.id, threadId: j.threadId, action: j.action, label: j.label || LABEL[j.action], output: j.output ?? null, status: j.status, startedAt: j.startedAt, endedAt: j.endedAt ?? null, error: j.error ?? null };
  }

  function emit(job, ev) {
    const e = { ...ev, at: new Date().toISOString() };
    job.events.push(e);
    fs.appendFile(store.jobLog(job.threadId, job.id), JSON.stringify(e) + "\n").catch(() => {});
    for (const s of job.subscribers) s.write(`data: ${JSON.stringify(e)}\n\n`);
  }

  async function startRun(thread, action, options) {
    if (action === "section") {
      const m = await store.readManuscript(thread.id);
      const i = m?.sections?.findIndex((x) => x.id === options?.sectionId) ?? -1;
      if (i < 0) return { status: 400, error: "Save the manuscript first, then try again." };
      const sec = m.sections[i];
      // The owner's notes and rules come from the saved manuscript, so every action sees the same ones.
      options = { ...options, _file: manuscriptFile(i, sec), title: options.title || sec.title, _book: { rules: m.rules || options.rules, knowledge: m.knowledge, idea: sec.idea || options.idea, pageNotes: sec.pageNotes } };
      if (options.op === "compose" && USES_BOOK(options.approach) && thread.files.length === 0) return { status: 400, error: "Upload your book to this project first, so Claude can build on it." };
    }
    const spec = buildRun(action, options);
    if (!spec) return { status: 400, error: "Unknown action." };
    if (spec.error) return { status: 400, error: spec.error };
    const isBook = action.startsWith("book-");
    if (action === "chat" && !String(options?.message || "").trim()) return { status: 400, error: "Write a message first." };
    if (action === "rewrite" && !String(options?.instructions || "").trim()) return { status: 400, error: "Give the rewrite instructions." };
    if (isBook && action !== "book-improve" && ["polish", "mine", "mine-and-research", "research"].includes(options?.approach) && thread.files.length === 0) return { status: 400, error: "Upload your book to this project first, so Claude can build on it." };
    if (action !== "chat" && action !== "section" && !isBook && thread.files.length === 0 && !options?.target && !(action === "tool" && options?.tool === "compare" && options?.a) && !(action === "tool" && options?.tool === "cover-copy" && String(options?.text || "").trim())) return { status: 400, error: "Upload a document first." };
    if (options?.target && options.target !== "source" && !inside(path.join(store.workDir(thread.id), "out"), options.target)) return { status: 400, error: "That file isn't in this project." };
    if (action === "tool" && options?.tool === "compare") {
      for (const k of ["a", "b"]) if (options[k] && !inside(store.workDir(thread.id), options[k])) return { status: 400, error: "Pick files from this project to compare." };
    }
    if (running) return { status: 409, error: "Claude is already working on something. Wait for it to finish or stop it." };
    if (!cfg.claudeToken) return { status: 503, error: "Claude Code is not connected yet: set CLAUDE_CODE_OAUTH_TOKEN on the runner." };
    if (tokenShape(cfg.claudeToken) === "api-key") return { status: 503, error: TOKEN_HELP["api-key"] };

    const cwd = store.workDir(thread.id);
    if (spec.instructions) await fs.writeFile(path.join(cwd, "INSTRUCTIONS.md"), spec.instructions);
    if (spec.needsVoice) {
      const voice = await store.readVoice();
      if (!voice.trim()) return { status: 400, error: "Create your voice profile first (Learn my voice), then save it as your profile." };
      await fs.writeFile(path.join(cwd, "VOICE.md"), voice);
    }
    for (const [rel, text] of Object.entries(spec.files || {})) {
      const p = inside(cwd, rel);
      if (!p) continue;
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, text);
    }
    await fs.mkdir(home, { recursive: true });

    const job = { id: randomUUID(), threadId: thread.id, action, label: spec.title || LABEL[action], output: spec.output || null, status: "running", startedAt: new Date().toISOString(), events: [], subscribers: new Set(), text: [] };
    jobs.set(job.id, job);
    running = job;

    const userLine = action === "section" ? `${spec.title} · ${options.title}${options.instructions || options.idea ? `\n\n${String(options.instructions || options.idea).trim()}` : ""}` : action === "tool" ? `${spec.title}${options?.target && options.target !== "source" ? ` · ${options.target}` : ""}${options?.language ? ` · ${options.language}` : ""}` : isBook ? `${LABEL[action]}${action === "book-outline" ? ` · ${String(options.bookTitle).trim()}` : ` ${Number(options.chapterIndex) + 1}${options.chapters?.[options.chapterIndex]?.title ? ` · ${options.chapters[options.chapterIndex].title}` : ""}`}` : action === "chat" ? String(options.message).trim() : `${LABEL[action]}${options?.target && options.target !== "source" ? ` · ${options.target}` : ""}${action === "rewrite" ? `\n\n${String(options.instructions).trim()}` : ""}`;
    thread.messages.push({ id: randomUUID(), role: "user", engine: "claude-code", action, text: userLine, at: job.startedAt, jobId: job.id });
    thread.runningJobId = job.id;
    await store.write(thread);

    const resume = thread.sessionId || null;
    const sessionId = resume ? null : randomUUID();
    const before = new Map((await store.scanOutputs(thread.id)).map((o) => [o.path, o.modifiedAt]));
    // Book results this run may replace keep their current content as a version first.
    for (const rel of before.keys()) if (isBookResult(rel)) await store.recordVersion(thread.id, rel, "Earlier result").catch(() => {});
    emit(job, { type: "status", status: "running", line: "Claude Code is starting…" });

    const run = runClaude({
      cfg, cwd, home, prompt: spec.prompt, sessionId, resume, timeoutMs: cfg.jobTimeoutMs,
      onEvent: (ev) => {
        if (ev.type === "session") return;
        if (ev.type === "text") job.text.push(ev.text);
        emit(job, ev);
      },
    });
    job.stop = run.stop;

    run.done.then(async (r) => {
      const t = (await store.read(thread.id)) || thread;
      if (r.sessionId) t.sessionId = r.sessionId;
      if (r.ok) setStatus({ state: "ok" });
      else if (r.errorKind === "auth") setStatus({ state: "signed_out", message: `${r.error} ${TOKEN_HELP[tokenShape(cfg.claudeToken)] ?? TOKEN_HELP.subscription}` });
      else if (r.errorKind === "limit") {
        const reset = r.rateLimit?.resetsAt ?? r.rateLimit?.resets_at;
        setStatus({ state: "limit", message: r.error, resetsAt: reset ? new Date(typeof reset === "number" ? reset * (reset < 1e12 ? 1000 : 1) : reset).toISOString() : null });
      }
      // A rewrite that finished its chapters but not the merged book still gives the owner a whole book.
      if (action === "rewrite") await mergeChapters(cwd).catch(() => {});
      const after = await store.scanOutputs(thread.id);
      const changed = after.filter((o) => before.get(o.path) !== o.modifiedAt).map((o) => o.path);
      for (const rel of changed) if (isBookResult(rel)) await store.recordVersion(thread.id, rel, options?.correct ? "Targeted correction" : job.label).catch(() => {});
      t.outputs = after;
      job.status = job.cancelled ? "cancelled" : r.ok ? "done" : "failed";
      job.error = job.cancelled ? null : r.error ?? null;
      job.endedAt = new Date().toISOString();
      t.messages.push({ id: randomUUID(), role: "assistant", engine: "claude-code", errorKind: r.ok ? null : r.errorKind ?? null, action, text: r.result || job.text.join("\n\n") || (job.cancelled ? "Stopped." : job.error || ""), at: job.endedAt, jobId: job.id, status: job.status, outputs: changed });
      delete t.runningJobId;
      await store.write(t);
      // A step with one expected file fails plainly if Claude didn't write it.
      if (job.status === "done" && job.output && !changed.includes(job.output)) { job.status = "failed"; job.error = "Claude finished without writing the result. Try again."; }
      emit(job, { type: "done", status: job.status, error: job.error, errorKind: job.status === "failed" ? r.errorKind ?? null : null, outputs: changed, output: job.output });
      for (const s of job.subscribers) s.end();
      job.subscribers.clear();
      running = null;
      // Finished jobs stay replayable from disk; free the memory after a while.
      setTimeout(() => jobs.delete(job.id), 10 * 60_000).unref();
    });
    return { status: 202, job: publicJob(job) };
  }

  async function mergeChapters(cwd) {
    const dir = path.join(cwd, "out", "rewrite");
    const full = path.join(cwd, "out", "rewrite.md");
    try { await fs.access(full); return; } catch { /* not written: merge */ }
    const names = (await fs.readdir(dir)).filter((n) => /^\d+.*\.md$/i.test(n)).sort();
    if (!names.length) return;
    const parts = await Promise.all(names.map((n) => fs.readFile(path.join(dir, n), "utf8")));
    await fs.writeFile(full, parts.map((p) => p.trim()).join("\n\n") + "\n");
  }

  async function stream(req, res, jobId, threadId) {
    let job = jobs.get(jobId);
    res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    if (job) {
      for (const e of job.events) res.write(`data: ${JSON.stringify(e)}\n\n`);
      if (job.status !== "running") return res.end();
      job.subscribers.add(res);
      const beat = setInterval(() => res.write(": keep-alive\n\n"), 20_000);
      req.on("close", () => { clearInterval(beat); job.subscribers.delete(res); });
      return;
    }
    // Not in memory (runner restarted or job long finished): replay the log.
    try {
      const log = await fs.readFile(store.jobLog(threadId, jobId), "utf8");
      for (const l of log.split("\n")) if (l.trim()) res.write(`data: ${l}\n\n`);
    } catch { res.write(`data: ${JSON.stringify({ type: "done", status: "unknown" })}\n\n`); }
    res.end();
  }

  async function route(req, res) {
    const url = new URL(req.url, "http://runner");
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
    if (parts[0] !== "v1") return fail(res, 404, "Not found.");

    const who = await auth.verify(req.headers.authorization);
    if (!who.ok) return fail(res, who.status, who.error);

    const [, kind, id, sub, ...rest] = parts;
    if (kind === "me" && req.method === "GET") {
      return send(res, 200, { user: who.user, claudeConnected: Boolean(cfg.claudeToken), token: tokenShape(cfg.claudeToken), claude: currentStatus(), busy: publicJob(running), citationStyles: CITATION_STYLES });
    }
    // "Check again": a tiny Claude Code run with no tools, to learn whether the token works now.
    if (kind === "claude" && id === "check" && req.method === "POST") {
      if (!cfg.claudeToken) return send(res, 200, { claude: currentStatus() });
      if (running) return fail(res, 409, "Claude is working on something. Check again when it's done.");
      const cwd = path.join(cfg.dataDir, "check");
      await fs.mkdir(cwd, { recursive: true }); await fs.mkdir(home, { recursive: true });
      const r = await runClaude({ cfg, cwd, home, prompt: "Reply with the single word OK.", timeoutMs: 90_000, onEvent: () => {} }).done;
      if (r.ok) setStatus({ state: "ok" });
      else if (r.errorKind === "auth") setStatus({ state: "signed_out", message: `${r.error} ${TOKEN_HELP[tokenShape(cfg.claudeToken)] ?? TOKEN_HELP.subscription}` });
      else if (r.errorKind === "limit") setStatus({ state: "limit", message: r.error, resetsAt: null });
      return send(res, 200, { claude: currentStatus() });
    }
    if (kind === "voice" && !id) {
      if (req.method === "GET") return send(res, 200, { voice: await store.readVoice() });
      if (req.method === "PUT") { const b = await json(req); await store.writeVoice(String(b.voice ?? "").slice(0, 200_000)); return send(res, 200, { ok: true }); }
    }
    if (kind === "threads" && !id) {
      if (req.method === "GET") return send(res, 200, { threads: await store.list() });
      if (req.method === "POST") { const b = await json(req); return send(res, 201, { thread: await store.create(b.title) }); }
    }
    if (kind === "threads" && id) {
      const thread = await store.read(id);
      if (!thread) return fail(res, 404, "Project not found.");
      if (!sub) {
        if (req.method === "GET") {
          // A job that was running when the runner restarted can never finish; say so once.
          if (thread.runningJobId && !jobs.has(thread.runningJobId)) {
            thread.messages.push({ id: randomUUID(), role: "assistant", action: "chat", text: "The runner restarted while this was running, so it stopped. Files already written are kept in the results.", at: new Date().toISOString(), jobId: thread.runningJobId, status: "failed", outputs: [] });
            delete thread.runningJobId;
            thread.outputs = await store.scanOutputs(id);
            await store.write(thread);
          }
          return send(res, 200, { thread, job: publicJob(thread.runningJobId ? jobs.get(thread.runningJobId) : null) });
        }
        if (req.method === "PATCH") { const b = await json(req); if (b.title) thread.title = String(b.title).slice(0, 160); return send(res, 200, { thread: await store.write(thread) }); }
        if (req.method === "DELETE") {
          if (running?.threadId === id) return fail(res, 409, "Stop the running job first.");
          await store.remove(id); return send(res, 200, { ok: true });
        }
      }
      if (sub === "files" && req.method === "POST" && !rest.length) {
        const name = url.searchParams.get("name");
        const k = url.searchParams.get("kind") === "text" ? "text" : "original";
        if (!name) return fail(res, 400, "Missing file name.");
        const buf = await body(req, cfg.maxUploadBytes);
        if (!buf.length) return fail(res, 400, "The file is empty.");
        return send(res, 201, { thread: await store.addFile(id, name, k, buf) });
      }
      if (sub === "files" && req.method === "DELETE" && rest.length === 1) return send(res, 200, { thread: await store.removeFile(id, safeName(rest[0])) });
      if (sub === "run" && req.method === "POST") {
        const b = await json(req);
        const action = String(b.action || "");
        if (!ACTIONS.has(action)) return fail(res, 400, "Unknown action.");
        const r = await startRun(thread, action, b.options || {});
        return r.job ? send(res, 202, { job: r.job }) : fail(res, r.status, r.error);
      }
      if (sub === "manuscript" && !rest.length) {
        if (req.method === "GET") return send(res, 200, { manuscript: await store.readManuscript(id) });
        if (req.method === "PUT") {
          if (running?.threadId === id && running.action === "section") return fail(res, 409, "Claude is working on a section; save again when it finishes.");
          const b = JSON.parse((await body(req, 30 * 1024 * 1024)).toString("utf8") || "{}");
          return send(res, 200, { manuscript: await store.writeManuscript(id, b.manuscript) });
        }
      }
      if (sub === "sources" && req.method === "GET" && rest.length === 1) {
        const text = await store.readSource(id, safeName(rest[0]));
        if (text == null) return fail(res, 404, "File not found.");
        return send(res, 200, { name: rest[0], text });
      }
      if (sub === "record" && req.method === "POST") {
        // Results produced by the API engine join the same project history.
        if (running?.threadId === id) return fail(res, 409, "Claude is working in this project right now.");
        const b = JSON.parse((await body(req, 30 * 1024 * 1024)).toString("utf8") || "{}");
        const files = Object.entries(b.outputs || {});
        const outRoot = path.join(store.workDir(id), "out");
        for (const [rel] of files) if (!inside(outRoot, rel) || !/\.(md|txt|json)$/i.test(rel)) return fail(res, 400, "Results must be Markdown, text or JSON inside the project.");
        for (const [rel] of files) if (isBookResult(rel)) await store.recordVersion(id, rel, "Earlier result").catch(() => {});
        for (const [rel, text] of files) { const p = inside(outRoot, rel); await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, String(text)); }
        for (const [rel] of files) if (isBookResult(rel)) await store.recordVersion(id, rel, `${String(b.label || b.action || "Result")} (API)`).catch(() => {});
        const t = await store.read(id);
        const at = new Date().toISOString();
        const jobId = randomUUID();
        if (b.userText) t.messages.push({ id: randomUUID(), role: "user", engine: "api", action: String(b.action || "chat"), text: String(b.userText).slice(0, 20000), at, jobId });
        t.messages.push({ id: randomUUID(), role: "assistant", engine: "api", action: String(b.action || "chat"), text: String(b.text || "").slice(0, 200000), at, jobId, status: b.status === "failed" ? "failed" : "done", outputs: files.map(([rel]) => rel) });
        t.outputs = await store.scanOutputs(id);
        return send(res, 200, { thread: await store.write(t) });
      }
      if (sub === "outputs" && req.method === "PUT" && rest.length) {
        // A new version of a book result: the owner's edits, a restored version or a restored paragraph.
        const rel = rest.join("/");
        if (!isBookResult(rel)) return fail(res, 400, "Only whole-book results keep versions.");
        if (running?.threadId === id) return fail(res, 409, "Claude is working in this project right now; save again when it finishes.");
        const b = JSON.parse((await body(req, 30 * 1024 * 1024)).toString("utf8") || "{}");
        const h0 = await store.history(id, rel);
        const latest = h0.versions[h0.versions.length - 1]?.n ?? 0;
        if (b.base != null && Number(b.base) !== latest) return fail(res, 409, `A newer version (${latest}) was saved after the one you edited (${b.base}). Open the latest and apply your change there.`);
        await store.recordVersion(id, rel, "Earlier result");
        if (!(await store.writeOutput(id, rel, String(b.text ?? "")))) return fail(res, 400, "That result can't be written.");
        const h = await store.recordVersion(id, rel, String(b.op || "Edited by the owner"), b.label);
        const t = await store.read(id); t.outputs = await store.scanOutputs(id); await store.write(t);
        return send(res, 200, { history: h });
      }
      if (sub === "history" && req.method === "GET" && rest.length) {
        const rel = rest.join("/");
        const n = url.searchParams.get("n");
        if (n) { const text = await store.readVersion(id, rel, n); return text == null ? fail(res, 404, "Version not found.") : send(res, 200, { text }); }
        return send(res, 200, { history: await store.history(id, rel) });
      }
      if (sub === "approve" && req.method === "POST" && rest.length) {
        // The owner's approval of one version as publication-ready. The app runs the checks and only
        // offers approval when nothing blocks and every review item is decided; the runner records
        // who approved which version and when, and the approval lapses when a newer version exists.
        const rel = rest.join("/");
        const b = JSON.parse((await body(req, 1024 * 1024)).toString("utf8") || "{}");
        const h = await store.history(id, rel);
        const latest = h.versions[h.versions.length - 1]?.n ?? 0;
        if (!latest || Number(b.version) !== latest) return fail(res, 409, "Only the latest saved version can be approved. Save your edits first.");
        const sum = b.summary && typeof b.summary === "object" ? b.summary : {};
        if (Number(sum.blockers) > 0) return fail(res, 400, "Fix the problems that block publishing before approving.");
        const approval = { version: latest, at: new Date().toISOString(), by: who.user?.email ?? who.user?.id ?? null,
          summary: { blockers: 0, reviews: Number(sum.reviews) || 0, decided: Number(sum.decided) || 0, checks: Array.isArray(sum.checks) ? sum.checks.slice(0, 20).map(String) : [], aiReview: Boolean(sum.aiReview) } };
        return send(res, 200, { history: await store.approve(id, rel, approval) });
      }
      if (sub === "outputs" && req.method === "GET" && rest.length) {
        const text = await store.readOutput(id, rest.join("/"));
        if (text == null) return fail(res, 404, "File not found.");
        return send(res, 200, { path: rest.join("/"), text });
      }
    }
    if (kind === "jobs" && id) {
      const job = jobs.get(id);
      if (sub === "stream" && req.method === "GET") {
        const threadId = job?.threadId || url.searchParams.get("thread") || "";
        if (!job && !(await store.read(threadId))) return fail(res, 404, "Job not found.");
        return stream(req, res, id, threadId);
      }
      if (sub === "cancel" && req.method === "POST") {
        if (!job || job.status !== "running") return fail(res, 409, "Nothing is running.");
        job.cancelled = true; job.stop?.();
        emit(job, { type: "status", status: "stopping", line: "Stopping…" });
        return send(res, 202, { job: publicJob(job) });
      }
    }
    return fail(res, 404, "Not found.");
  }

  const server = http.createServer(async (req, res) => {
    cors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    try { await route(req, res); }
    catch (e) {
      if (!res.headersSent) fail(res, e.status || 500, e.status === 413 ? "The file is too large." : e.status === 400 ? "The request could not be read." : "Something went wrong on the runner.");
      else res.end();
      if (!e.status) console.error("runner error:", e.message);
    }
  });
  server.requestTimeout = 0; // uploads and streams can be long
  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const cfg = loadConfig();
  const problems = configProblems(cfg);
  if (problems.length) { console.error("Claude Studio runner is not configured:\n- " + problems.join("\n- ")); process.exit(1); }
  if (!cfg.claudeToken) console.warn("CLAUDE_CODE_OAUTH_TOKEN is not set: runs will be refused until it is.");
  createServer(cfg).listen(cfg.port, () => console.log(`Claude Studio runner listening on :${cfg.port}`));
}
