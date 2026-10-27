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
const VERSION_KINDS = new Set(["snapshot", "autosave", "before-accept", "before-restore"]);

export function safeName(name) {
  const base = path.basename(String(name || "file")).normalize("NFKC").replace(/[^\p{L}\p{N}._ -]+/gu, "_").replace(/^[.\s]+/, "").slice(0, 120);
  return base || "file";
}

/** Resolves a path inside `root`, refusing anything that would escape it. */
export function inside(root, rel) {
  const p = path.resolve(root, String(rel || ""));
  return p === root || p.startsWith(root + path.sep) ? p : null;
}

export const manuscriptFile = (i, x) => `${String(i + 1).padStart(2, "0")}-${String(x.kind).replace(/[^a-z-]/g, "")}-${String(x.title || "section").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "section"}.md`;

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
    // The manuscript (sections in order) is kept as JSON, and mirrored as one
    // Markdown file per section under work/manuscript/ so Claude can read it.
    async readManuscript(id) {
      const d = dir(id);
      if (!d) return null;
      try { return JSON.parse(await fs.readFile(path.join(d, "manuscript.json"), "utf8")); } catch { return null; }
    },
    async writeManuscript(id, m) {
      const d = dir(id);
      if (!d) return null;
      const sections = Array.isArray(m?.sections) ? m.sections : [];
      const clean = { title: String(m?.title ?? "").slice(0, 300), subtitle: String(m?.subtitle ?? "").slice(0, 300), author: String(m?.author ?? "").slice(0, 200), sections: sections.map((x) => ({
        id: String(x.id).replace(/[^\w-]/g, "").slice(0, 64), kind: String(x.kind ?? "chapter").slice(0, 40), title: String(x.title ?? "").slice(0, 300), body: String(x.body ?? ""),
        // Guided rewrite: Claude's summary, the owner's idea, and the text before the rewrite.
        ...(x.summary ? { summary: String(x.summary).slice(0, 20_000) } : {}), ...(x.idea ? { idea: String(x.idea).slice(0, 20_000) } : {}), ...(x.original ? { original: String(x.original) } : {}),
        ...(Array.isArray(x.pageNotes) && x.pageNotes.length ? { pageNotes: x.pageNotes.slice(0, 500).map((n) => ({ page: String(n?.page ?? "").slice(0, 20), text: String(n?.text ?? "").slice(0, 2000) })).filter((n) => n.text.trim()) } : {}),
        // Version history: snapshots, autosaved revisions, the text before accepted changes and restores.
        ...(Array.isArray(x.versions) && x.versions.length ? { versions: x.versions.slice(-40).map((v) => ({
          id: String(v?.id ?? "").replace(/[^\w-]/g, "").slice(0, 40), at: String(v?.at ?? "").slice(0, 40),
          kind: VERSION_KINDS.has(v?.kind) ? v.kind : "snapshot", title: String(v?.title ?? "").slice(0, 300), body: String(v?.body ?? ""),
          ...(v?.label ? { label: String(v.label).slice(0, 120) } : {}),
        })).filter((v) => v.id) } : {}),
      })),
        rules: String(m?.rules ?? "").slice(0, 20_000),
        // The book's knowledge base, production details and the Library book it was saved as.
        ...(m?.knowledge && typeof m.knowledge === "object" ? { knowledge: { rules: String(m.knowledge.rules ?? "").slice(0, 20_000), terminology: String(m.knowledge.terminology ?? "").slice(0, 20_000), forbidden: String(m.knowledge.forbidden ?? "").slice(0, 20_000) } } : {}),
        ...(Array.isArray(m?.knowledgeDocIds) ? { knowledgeDocIds: m.knowledgeDocIds.slice(0, 50).map(String) } : {}),
        ...(m?.meta && typeof m.meta === "object" && !Array.isArray(m.meta) && JSON.stringify(m.meta).length <= 50_000 ? { meta: m.meta } : {}),
        ...(m?.libraryId ? { libraryId: String(m.libraryId).slice(0, 80) } : {}),
        history: Array.isArray(m?.history) ? m.history.slice(-2000) : [], updatedAt: new Date().toISOString() };
      await fs.writeFile(path.join(d, "manuscript.json.tmp"), JSON.stringify(clean));
      await fs.rename(path.join(d, "manuscript.json.tmp"), path.join(d, "manuscript.json"));
      const md = path.join(workDir(id), "manuscript");
      await fs.rm(md, { recursive: true, force: true });
      await fs.mkdir(md, { recursive: true });
      const index = [`# ${clean.title || "Untitled book"}`, ""];
      for (const [i, x] of clean.sections.entries()) {
        const file = manuscriptFile(i, x);
        index.push(`${i + 1}. ${file} · ${x.kind} · ${x.title}${x.idea ? ` · plan: ${x.idea.replace(/\s+/g, " ").slice(0, 400)}` : ""}`);
        await fs.writeFile(path.join(md, file), `## ${x.title}\n\n${x.body}\n`);
      }
      await fs.writeFile(path.join(md, "INDEX.md"), index.join("\n") + "\n");
      return clean;
    },
    async readVoice() {
      try { return await fs.readFile(path.join(dataDir, "voice-profile.md"), "utf8"); } catch { return ""; }
    },
    async writeVoice(text) {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(path.join(dataDir, "voice-profile.md"), String(text ?? ""));
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
