import { useMemo } from "react";
import Workspace from "@/components/studio/workspace/Workspace";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/newsreader/400-italic.css";
import type { ResultHistory } from "@/lib/claude-studio";
import type { Manuscript } from "@/lib/manuscript";
import type { RunOptions, StudioEvent, StudioJob, StudioThread } from "@/lib/claude-studio";
import type { EngineDecision, StudioBackend } from "@/lib/studio-backend";
import { parseDesign } from "@/lib/book-design";

// Development only (not routed in production builds): the real Claude Studio
// workspace against an in-memory stand-in engine, for visual review and
// screenshots without the owner's sign-in or the runner. Sample text only.

const SAMPLE: Manuscript = {
  title: "Demonology", subtitle: "A study of spirits in scripture and tradition", author: "[Author name]",
  rules: "Write Yahusha instead of Jesus\nWrite Yahuah instead of God (never Jehovah or Yahweh)",
  history: [], libraryId: "demo-book", meta: { trimSize: "6x9", paper: "Cream", language: "English" },
  sections: [
    { id: "pre", kind: "preface", title: "Preface", body: "This book began as a set of lectures. [[YOURS: why you wrote it]]" },
    { id: "c1", kind: "chapter", title: "Defining the Subject: Terms, Methods and Sources", body: "Before we can speak about spirits we must define our terms. This chapter sets out the words the book uses, the method it follows, and the sources it draws on.\n\nThe study proceeds from the texts themselves, reading each in its own setting before comparing it with others." },
    { id: "c2", kind: "chapter", title: "Spirits in the Ancient Near East", idea: "Open with Mesopotamia, then compare with Israel. Keep all my scripture references.",
      summary: "Traces belief in spirits through Mesopotamian, Egyptian and Canaanite sources, and argues that these ideas shaped the words later used in Israel.",
      pageNotes: [{ page: "14", text: "Keep this opening sentence word for word." }, { page: "19", text: "Add the source for this quotation." }],
      body: "The people of the ancient world did not doubt that spirits were real. God's people lived among nations whose texts are full of them.\n\nIn Babylon the priests wrote long incantations against the spirits that brought fever and plague, and protected doorways with images.\n\nThese spirits had names." },
    { id: "c3", kind: "chapter", title: "Evil Spirits in the Hebrew Bible", body: "" },
    { id: "c4", kind: "chapter", title: "The Second Temple Period: Expansion of Demonic Traditions", body: "" },
    { id: "bib", kind: "bibliography", title: "Bibliography", body: "" },
  ],
};
// A stand-in front cover (the real one comes from Cover Studio).
const COVER = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2438"/><stop offset="1" stop-color="#0B1020"/></linearGradient></defs>
<rect width="600" height="900" fill="url(#g)"/><circle cx="300" cy="380" r="150" fill="none" stroke="#C9A55B" stroke-width="2" opacity=".7"/><circle cx="300" cy="380" r="110" fill="none" stroke="#C9A55B" stroke-width="1" opacity=".5"/>
<text x="300" y="640" text-anchor="middle" font-family="Georgia,serif" font-size="74" fill="#F3E7C9" letter-spacing="6">DEMONOLOGY</text>
<text x="300" y="700" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="24" fill="#D8C9A3">A study of spirits in scripture and tradition</text>
<text x="300" y="830" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#C9A55B" letter-spacing="4">AUTHOR NAME</text></svg>`)}`;
const REWRITE = "### A world full of spirits\n\nThe people of the ancient world did not doubt that spirits were real. Yahuah's people lived among nations whose texts are full of them, and the language of those texts left its mark on Israel's own.\n\nIn Babylon, priests composed long incantations against the spirits believed to bring fever and plague, and guarded doorways with protective images (Black & Green, 1992).\n\n### Names and boundaries\n\nThese spirits had names and distinct roles. They were feared, warded off and bargained with, but not worshipped like the great gods.";

// A whole-book rewrite with the defects the owner's October 2026 review found, to show the editorial check (DESIGN-SPEC.md §15).
const SAMPLE_REWRITE = `# Demonology I

## Course description

This course forms part of a bachelor's programme in theology. It covers angelology, demonology and exorcism, and ends with the role of angels in Christian spirituality. Learning outcomes are listed below.

### Course schedule

1. The creation of angels
2. Angelic hierarchies
3. Angels in salvation history
4. The Incarnation and the angels
6. Spirits in the Ancient Near East

## Part II Demonology

### 19. Spirits in the Ancient Near East

The people of the ancient world did not doubt that spirits were real. The origin of the Devil and his angels is clear from Scripture. Yahuah's people lived among nations whose texts are full of them.

**20. Sift**

In Babylon the priests wrote long incantations against the spirits that brought fever and plague \\[citation needed\\]. The Holy Ghost protects the believer.

**20. Devour**

The adversary seeks whom he may devour. The Holy Spirit is the believer's guard. The origin and identity of demons cannot be known for certain.

### 21. Testimony

In a dream I saw many people in chains, and many of them were Christians in church. Wherever I am, demons must pack and go out IN THE NAME OF Yahusha.

Some teach that demons cause homosexual tendencies in certain people.

## References

*(To be completed.)*
`;


// A stand-in design for "Rebuild as a professional book" (sample text only).
const DESIGN = JSON.stringify({
  title: "Demonology", subtitle: "A course on spirits in scripture and tradition", reader: "Bible-school and university students meeting the subject for the first time",
  rationale: "The manuscript moves between definitions, history and testimony. The course builds from terms and method, through the scriptural witness in order, to the author's teaching on deliverance, with testimony placed in the chapters it illustrates.",
  sections: [
    { kind: "introduction", title: "Introduction: How to Use This Course", summary: "What the course covers, how each chapter is built, and how to study it.", keyPoints: [], draws: "Preface; Chapter 1 (opening)", apparatus: "Course map" },
    { kind: "part", title: "Part One: Foundations", summary: "Terms, method and the ancient setting." },
    { kind: "chapter", title: "Terms, Method and Sources", summary: "The words the book uses and how scripture and tradition are weighed.", keyPoints: ["Definitions", "Method"], draws: "Chapter 1; pp. 3–12", apparatus: "Learning outcomes, key terms, summary, review questions" },
    { kind: "chapter", title: "Spirits in the Ancient Near East", summary: "Mesopotamian, Egyptian and Canaanite beliefs, and Israel's difference.", keyPoints: [], draws: "Chapter 2; pp. 14–22, 87–90", apparatus: "Learning outcomes, summary, review questions" },
    { kind: "part", title: "Part Two: The Scriptural Witness", summary: "" },
    { kind: "chapter", title: "Evil Spirits in the Hebrew Bible", summary: "The passages in canonical order, with the author's reading of each.", keyPoints: [], draws: "Chapter 3; scattered notes on pp. 40–55", apparatus: "Learning outcomes, summary, review questions" },
    { kind: "chapter", title: "The Second Temple Period", summary: "How the traditions grew between the testaments.", keyPoints: [], draws: "Chapter 4", apparatus: "Learning outcomes, summary, review questions" },
    { kind: "conclusion", title: "Conclusion", summary: "The threads drawn together, and the call to the reader.", keyPoints: [], draws: "Closing pages", apparatus: "" },
    { kind: "glossary", title: "Glossary", summary: "Every key term as the book uses it.", keyPoints: [], draws: "The whole book", apparatus: "" },
  ],
  unplaced: [{ what: "A second list of the names of spirits", where: "p. 61", why: "Repeats the list in Terms, Method and Sources word for word" }],
  missing: ["The preface promises a course schedule; the material has none."],
});

function previewBackend(): StudioBackend {
  // ?scene=stopped shows a rewrite that stopped partway; ?scene=long a chapter too long to work on well (§21).
  const scene = new URLSearchParams(location.search).get("scene");
  let m: Manuscript = JSON.parse(JSON.stringify(SAMPLE));
  // ?scene=leftover: the rest of a contents list left in the book as "Opening pages" (§22).
  if (scene === "leftover") {
    const c2 = m.sections.find((x) => x.id === "c2")!;
    c2.body = `${c2.body}\n\nThe Gods of Babylon\n\nThe Babylonians named their gods and spirits and set them in order beneath the high gods of the cities.\n\nThe Gods of Canaan\n\nCanaan's gods are known from Ugarit, where the texts describe the council of El and the deeds of Baal.\n\nThe Angel of Yahuah\n\nIn Israel the angel of Yahuah speaks as Yahuah himself and is worshipped where no angel would be.\n\n5. Spirits in the Gospels\n\nThe gospels show Yahusha casting out spirits by a word, with no ritual and no name but his own.`;
    m.sections.splice(1, 0, { id: "o1", kind: "chapter", title: "Opening pages", body: "The Gods of Babylon\nThe Gods of Canaan\nThe Angel of Yahuah\n5. Spirits in the Gospels" });
  }
  if (scene === "long") m.sections = m.sections.map((x, i) => (i === m.sections.findIndex((y) => y.kind === "chapter") ? { ...x, body: `${x.body}\n\n${"The spirits of the nations are named and described throughout the ancient texts. ".repeat(1400)}` } : x));
  const thread: StudioThread = {
    id: "demo", title: "Demonology", createdAt: "", updatedAt: "",
    files: [{ name: "DEMONOLOGY.pdf", storedAs: "DEMONOLOGY.pdf", kind: "original", bytes: 2_400_000, at: "2026-10-20T09:12:00Z" }, { name: "DEMONOLOGY.txt", storedAs: "DEMONOLOGY.txt", kind: "text", bytes: 600_000, at: "2026-10-20T09:13:00Z" }, { name: "Demonology notes.docx", storedAs: "Demonology notes.docx", kind: "original", bytes: 84_000, at: "2026-10-24T16:40:00Z" }],
    outputs: [{ path: "rewrite-plan.md", bytes: 900, modifiedAt: new Date().toISOString() }, { path: "rewrite.md", bytes: 3100, modifiedAt: new Date().toISOString() }, { path: "summary.md", bytes: 4200, modifiedAt: new Date().toISOString() }, { path: "quotes-check.md", bytes: 9800, modifiedAt: new Date().toISOString() }],
    messages: [{ id: "m1", role: "user", action: "chat", text: "List every scripture quoted in chapter 3.", at: "" }, { id: "m2", role: "assistant", action: "chat", text: "Saved as **Scripture in chapter 3**: 23 references, with the page of each.", at: "", engine: "claude-code", status: "done" },
      ...(scene === "stopped" ? [{ id: "m3", role: "assistant", action: "rewrite", text: "Claude's plan limit was reached.", at: "", engine: "claude-code", status: "failed", resume: { action: "rewrite", options: { continueRun: true }, what: "7 chapters written" } }] : [])],
  } as unknown as StudioThread;
  const out: Record<string, string> = { "rewrite-plan.md": "# Editorial plan\n\n## Proposed contents\n\n**Part One — The Unseen War**\n\n1. **The Two Kingdoms** — the book's thesis; draws on the original's chapters 1–2.\n2. **Names of the Enemy** — consolidates the two lists of names (pp. 14–22, 61).\n3. **Spirits in the Ancient Near East** — keeps every scripture reference.\n\n**Part Two — Authority of the Believer**\n\n4. **Given Authority** — the testimonies of chapter 9, kept in full.\n\n## Terminology\n\nYahusha for Jesus and Yahuah for God, outside quotations.\n\n## Gaps to report, not fill\n\n- The preface promises a course schedule the material does not contain.", "rewrite.md": SAMPLE_REWRITE, "summary.md": "# Demonology — Summary\n\nA faithful overview of the book.", "quotes-check.md": "# Quotations check\n\nAll quotations verified." };
  const runs: RunOptions[] = [];
  const hist: Record<string, ResultHistory> = { "rewrite.md": { path: "rewrite.md", versions: [
    { n: 1, at: "2026-10-26T18:02:00Z", op: "Rewrite", bytes: 3000, words: 210 }, { n: 2, at: "2026-10-27T09:40:00Z", op: "Rewrite", bytes: 3100, words: 215 }], approval: null } };
  const vers: Record<string, string> = { "rewrite.md|1": SAMPLE_REWRITE.replace("**20. Devour**", "**21. Devour**"), "rewrite.md|2": SAMPLE_REWRITE };
  return {
    storage: "browser",
    threads: async () => [{ id: "demo", title: "Demonology", files: 2, outputs: 2 }] as never,
    create: async () => thread, thread: async () => ({ thread, job: null }), rename: async (_i, t) => ({ ...thread, title: t }),
    remove: async () => ({}), removeFile: async () => thread, upload: async () => thread,
    run: async (_id, _a, o) => { runs.push(o); return { id: `j${runs.length}`, threadId: "demo", action: "section", label: "Rewrite section", output: null, status: "running", startedAt: "", endedAt: null, error: null } as StudioJob; },
    follow: async (_j, on, signal) => {
      const o = runs.at(-1)!;
      const step = (line: string) => on({ type: "tool", name: "x", line, at: "" } as StudioEvent);
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      step("Reading source/DEMONOLOGY.txt"); await wait(500); if (signal.aborted) return;
      if (o.op === "compose" && o.approach && o.approach !== "polish" && o.approach !== "mine") { step("Searching the web: Mesopotamian protective images"); await wait(400); step("Opening https://www.britishmuseum.org/collection"); await wait(400); }
      step(`Writing out/sections/${o.sectionId}.md`); await wait(new URLSearchParams(location.search).get("slow") ? 60_000 : 700);
      const sid = String(o.sectionId);
      if (o.op === "explain") out[`sections/${sid}-summary.md`] = "Traces belief in spirits through Mesopotamian, Egyptian and Canaanite sources.";
      else { out[`sections/${sid}.md`] = REWRITE; out[`sections/${sid}-notes.md`] = "### From your book\n\nPages 14–22 (Ancient Near East) and 87–90 (incantation texts).\n\n### Added from other sources\n\nBlack & Green, *Gods, Demons and Symbols of Ancient Mesopotamia* (1992).\n\n### Your notes and rules\n\nOpened with Mesopotamia as asked. “God” → “Yahuah” once.\n\n### For you to check\n\nThe quotation on page 19 has no source in your book."; }
      on({ type: "done", status: "done", outputs: [`sections/${sid}.md`, `sections/${sid}-notes.md`], output: o.op === "explain" ? `sections/${sid}-summary.md` : `sections/${sid}.md`, at: "" } as StudioEvent);
    },
    output: async (_id, p) => out[p] ?? "",
    cancel: async () => ({}),
    // Stand-in extracted text for the sample PDF (the notes file has none, to show that state).
    source: async (_id, storedAs) => (storedAs === "DEMONOLOGY.txt" ? `# Demonology\n\n${SAMPLE.sections.map((x) => x.body).join("\n\n").repeat(40)}` : null),
    manuscript: async () => m, saveManuscript: async (_id, x) => { m = x; return x; },
    voice: async () => "", saveVoice: async () => ({}),
    // Versions in memory, as the runner keeps them.
    history: async (_id, p) => hist[p] ?? { path: p, versions: [], approval: null },
    version: async (_id, p, n) => vers[`${p}|${n}`] ?? "",
    saveOutput: async (_id, p, text, o) => {
      const h = hist[p] ??= { path: p, versions: [], approval: null };
      const latest = h.versions.at(-1)?.n ?? 0;
      if (o.base != null && o.base !== latest) throw new Error(`A newer version (${latest}) was saved after the one you edited (${o.base}).`);
      out[p] = text; const n = latest + 1; vers[`${p}|${n}`] = text;
      h.versions.push({ n, at: new Date().toISOString(), op: o.op, bytes: text.length, words: text.split(/\s+/).length });
      return h;
    },
    approve: async (_id, p, a) => { const h = hist[p]; h.approval = { version: a.version, at: new Date().toISOString(), by: "owner@polishedpages.example", summary: a.summary }; return h; },
  };
}

export default function StudioPreview() {
  const backend = useMemo(previewBackend, []);
  // ?engine=api previews the API engine (and its cost notice).
  const api = new URLSearchParams(window.location.search).get("engine") === "api";
  const decision = { active: api ? "api" : "claude-code", tone: "ok", reason: api ? "Using the API (preview)." : "Claude Code is signed in (preview).", fix: null } as unknown as EngineDecision;
  return (
    <Workspace id="demo" backend={backend} decision={decision} mode="auto" onMode={() => {}} onCheckEngine={async () => {}} busy={false} busyElsewhere={false} ready
      citationStyles={["APA 7", "Chicago (notes and bibliography)", "SBL"]} threads={[{ id: "demo", title: "Demonology", files: 2, outputs: 2 }] as never}
      onProject={() => {}} onNewProject={async () => {}} handoff={null} onHandoffUsed={() => {}} onChanged={() => {}} onDeleted={() => {}}
      onWorkInStudio={async () => {}} onLearnVoice={async () => {}} findCover={async () => COVER}
      designer={async () => { await new Promise((r) => setTimeout(r, 600)); return parseDesign(DESIGN); }} />
  );
}
