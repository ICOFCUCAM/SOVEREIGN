import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// Threads live on the runner's disk, one folder each:
//   <data>/threads/<id>/thread.json   title, messages, files, outputs, Claude session id
//   <data>/threads/<id>/work/         Claude Code's working directory (its only allowed area)
//     source/   the owner's uploads (original file + extracted text)
//     out/      everything Claude writes
//   <data>/threads/<id>/jobs/<job>.jsonl   the event log of each run, for replay
const ID = /^[0-9a-f-]{36}$/;

export function safeName(name) {
  const base = path.basename(String(name || "file")).normalize("NFKC").replace(/[^\p{L}\p{N}._ -]+/gu, "_").replace(/^[.\s]+/, "").slice(0, 120);
  return base || "file";
}

/** Resolves a path inside `root`, refusing anything that would escape it. */
export function inside(root, rel) {
  const p = path.resolve(root, String(rel || ""));
  return p === root || p.startsWith(root + path.sep) ? p : null;
}

export function createStore(dataDir) {
  const threadsDir = path.join(dataDir, "threads");
  const dir = (id) => (ID.test(id) ? path.join(threadsDir, id) : null);
  const workDir = (id) => path.join(dir(id), "work");

  async function read(id) {
    const d = dir(id);
    if (!d) return null;
    try { return JSON.parse(await fs.readFile(path.join(d, "thread.json"), "utf8")); } catch { return null; }
  }
  async function write(t) {
    t.updatedAt = new Date().toISOString();
    const file = path.join(dir(t.id), "thread.json");
    await fs.writeFile(file + ".tmp", JSON.stringify(t, null, 1));
    await fs.rename(file + ".tmp", file);
    return t;
  }

  return {
    workDir,
    jobLog: (id, jobId) => path.join(dir(id), "jobs", `${jobId}.jsonl`),
    async create(title) {
      const id = randomUUID();
      const d = path.join(threadsDir, id);
      await fs.mkdir(path.join(d, "work", "source"), { recursive: true });
      await fs.mkdir(path.join(d, "work", "out"), { recursive: true });
      await fs.mkdir(path.join(d, "jobs"), { recursive: true });
      const now = new Date().toISOString();
      return write({ id, title: String(title || "Untitled project").slice(0, 160), createdAt: now, updatedAt: now, sessionId: null, files: [], messages: [], outputs: [] });
    },
    read,
    write,
    async list() {
      let names = [];
      try { names = await fs.readdir(threadsDir); } catch { return []; }
      const all = (await Promise.all(names.map(read))).filter(Boolean);
      return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(({ id, title, createdAt, updatedAt, files, outputs }) => ({ id, title, createdAt, updatedAt, files: files.length, outputs: outputs.length }));
    },
    async remove(id) {
      const d = dir(id);
      if (d) await fs.rm(d, { recursive: true, force: true });
    },
    async addFile(id, name, kind, buf) {
      const t = await read(id);
      if (!t) return null;
      const clean = safeName(name);
      const stored = kind === "text" ? `${clean.replace(/\.[^.]+$/, "")}.txt` : clean;
      // A plain-text original already is its text; never let the copy replace it.
      if (kind === "text" && t.files.some((f) => f.kind === "original" && f.storedAs === stored)) return t;
      await fs.writeFile(path.join(workDir(id), "source", stored), buf);
      const files = t.files.filter((f) => f.storedAs !== stored);
      files.push({ name: clean, storedAs: stored, kind, bytes: buf.length, at: new Date().toISOString() });
      t.files = files;
      return write(t);
    },
    async removeFile(id, storedAs) {
      const t = await read(id);
      if (!t) return null;
      const p = inside(path.join(workDir(id), "source"), storedAs);
      if (p) await fs.rm(p, { force: true });
      t.files = t.files.filter((f) => f.storedAs !== storedAs);
      return write(t);
    },
    /** Every Markdown/text file Claude has written under out/, newest first. */
    async scanOutputs(id) {
      const root = path.join(workDir(id), "out");
      const found = [];
      async function walk(d) {
        let entries = [];
        try { entries = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
        for (const e of entries) {
          const p = path.join(d, e.name);
          if (e.isDirectory()) await walk(p);
          else if (/\.(md|txt|markdown|json)$/i.test(e.name)) {
            const st = await fs.stat(p);
            found.push({ path: path.relative(root, p).split(path.sep).join("/"), bytes: st.size, modifiedAt: st.mtime.toISOString() });
          }
        }
      }
      await walk(root);
      return found.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    },
    async readSource(id, storedAs) {
      const p = inside(path.join(workDir(id), "source"), storedAs);
      if (!p) return null;
      try { return await fs.readFile(p, "utf8"); } catch { return null; }
    },
    async readOutput(id, rel) {
      const p = inside(path.join(workDir(id), "out"), rel);
      if (!p) return null;
      try { return await fs.readFile(p, "utf8"); } catch { return null; }
    },
  };
}
