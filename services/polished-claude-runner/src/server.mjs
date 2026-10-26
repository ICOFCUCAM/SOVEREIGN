import http from "node:http";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadConfig, configProblems } from "./config.mjs";
import { createAuth } from "./auth.mjs";
import { createStore, safeName, inside } from "./store.mjs";
import { buildRun, CITATION_STYLES } from "./prompts.mjs";
import { runClaude } from "./claude.mjs";

// Claude Studio runner. A small HTTP API in front of the owner's Claude Code:
//   GET    /health                          liveness (no data)
//   GET    /v1/me                           who you are, whether the runner is ready
//   GET    /v1/threads                      projects
//   POST   /v1/threads                      {title} → new project
//   GET    /v1/threads/:id                  project with messages, files, outputs, running job
//   PATCH  /v1/threads/:id                  {title}
//   DELETE /v1/threads/:id
//   POST   /v1/threads/:id/files?name=&kind=original|text   raw body upload
//   DELETE /v1/threads/:id/files/:storedAs
//   POST   /v1/threads/:id/run              {action: chat|summarize|rewrite|cite, options}
//   GET    /v1/threads/:id/outputs/<path>   a file Claude wrote (text)
//   GET    /v1/jobs/:id/stream              server-sent events: replay + live
//   POST   /v1/jobs/:id/cancel
// One run at a time: this is one person's Claude plan, not a shared service.
const ACTIONS = new Set(["chat", "summarize", "rewrite", "cite", "book-outline", "book-chapter", "book-improve"]);
const LABEL = { chat: "Chat", summarize: "Summarise", rewrite: "Rewrite", cite: "Citations & references", "book-outline": "Book wizard · outline", "book-chapter": "Book wizard · chapter", "book-improve": "Book wizard · improve" };

export function createServer(cfg = loadConfig(), deps = {}) {
  const auth = deps.auth || createAuth(cfg, deps.fetch);
  const store = createStore(cfg.dataDir);
  const home = path.join(cfg.dataDir, "home");
  const jobs = new Map(); // id → job (kept in memory for streaming; logs on disk)
  let running = null;

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
    return j && { id: j.id, threadId: j.threadId, action: j.action, label: LABEL[j.action], output: j.output ?? null, status: j.status, startedAt: j.startedAt, endedAt: j.endedAt ?? null, error: j.error ?? null };
  }

  function emit(job, ev) {
    const e = { ...ev, at: new Date().toISOString() };
    job.events.push(e);
    fs.appendFile(store.jobLog(job.threadId, job.id), JSON.stringify(e) + "\n").catch(() => {});
    for (const s of job.subscribers) s.write(`data: ${JSON.stringify(e)}\n\n`);
  }

  async function startRun(thread, action, options) {
    const spec = buildRun(action, options);
    if (!spec) return { status: 400, error: "Unknown action." };
    if (spec.error) return { status: 400, error: spec.error };
    const isBook = action.startsWith("book-");
    if (action === "chat" && !String(options?.message || "").trim()) return { status: 400, error: "Write a message first." };
    if (action === "rewrite" && !String(options?.instructions || "").trim()) return { status: 400, error: "Give the rewrite instructions." };
    if (action !== "chat" && !isBook && thread.files.length === 0 && !options?.target) return { status: 400, error: "Upload a document first." };
    if (options?.target && options.target !== "source" && !inside(path.join(store.workDir(thread.id), "out"), options.target)) return { status: 400, error: "That file isn't in this project." };
    if (running) return { status: 409, error: "Claude is already working on something. Wait for it to finish or stop it." };
    if (!cfg.claudeToken) return { status: 503, error: "Claude Code is not connected yet: set CLAUDE_CODE_OAUTH_TOKEN on the runner." };

    const cwd = store.workDir(thread.id);
    if (spec.instructions) await fs.writeFile(path.join(cwd, "INSTRUCTIONS.md"), spec.instructions);
    for (const [rel, text] of Object.entries(spec.files || {})) {
      const p = inside(cwd, rel);
      if (!p) continue;
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, text);
    }
    await fs.mkdir(home, { recursive: true });

    const job = { id: randomUUID(), threadId: thread.id, action, output: spec.output || null, status: "running", startedAt: new Date().toISOString(), events: [], subscribers: new Set(), text: [] };
    jobs.set(job.id, job);
    running = job;

    const userLine = isBook ? `${LABEL[action]}${action === "book-outline" ? ` · ${String(options.bookTitle).trim()}` : ` ${Number(options.chapterIndex) + 1}${options.chapters?.[options.chapterIndex]?.title ? ` · ${options.chapters[options.chapterIndex].title}` : ""}`}` : action === "chat" ? String(options.message).trim() : `${LABEL[action]}${options?.target && options.target !== "source" ? ` · ${options.target}` : ""}${action === "rewrite" ? `\n\n${String(options.instructions).trim()}` : ""}`;
    thread.messages.push({ id: randomUUID(), role: "user", action, text: userLine, at: job.startedAt, jobId: job.id });
    thread.runningJobId = job.id;
    await store.write(thread);

    const resume = thread.sessionId || null;
    const sessionId = resume ? null : randomUUID();
    const before = new Map((await store.scanOutputs(thread.id)).map((o) => [o.path, o.modifiedAt]));
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
      // A rewrite that finished its chapters but not the merged book still gives the owner a whole book.
      if (action === "rewrite") await mergeChapters(cwd).catch(() => {});
      const after = await store.scanOutputs(thread.id);
      const changed = after.filter((o) => before.get(o.path) !== o.modifiedAt).map((o) => o.path);
      t.outputs = after;
      job.status = job.cancelled ? "cancelled" : r.ok ? "done" : "failed";
      job.error = job.cancelled ? null : r.error ?? null;
      job.endedAt = new Date().toISOString();
      t.messages.push({ id: randomUUID(), role: "assistant", action, text: r.result || job.text.join("\n\n") || (job.cancelled ? "Stopped." : job.error || ""), at: job.endedAt, jobId: job.id, status: job.status, outputs: changed });
      delete t.runningJobId;
      await store.write(t);
      // A step with one expected file fails plainly if Claude didn't write it.
      if (job.status === "done" && job.output && !changed.includes(job.output)) { job.status = "failed"; job.error = "Claude finished without writing the result. Try again."; }
      emit(job, { type: "done", status: job.status, error: job.error, outputs: changed, output: job.output });
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
      return send(res, 200, { user: who.user, claudeConnected: Boolean(cfg.claudeToken), busy: publicJob(running), citationStyles: CITATION_STYLES });
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
