import { useMemo } from "react";
import Workspace from "@/components/studio/workspace/Workspace";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/newsreader/400-italic.css";
import type { Manuscript } from "@/lib/manuscript";
import type { RunOptions, StudioEvent, StudioJob, StudioThread } from "@/lib/claude-studio";
import type { EngineDecision, StudioBackend } from "@/lib/studio-backend";

// Development only (not routed in production builds): the real Claude Studio
// workspace against an in-memory stand-in engine, for visual review and
// screenshots without the owner's sign-in or the runner. Sample text only.

const SAMPLE: Manuscript = {
  title: "Demonology", subtitle: "A study of spirits in scripture and tradition", author: "[Author name]",
  rules: "Write Yahusha instead of Jesus\nWrite Yahuah instead of God (never Jehovah or Yahweh)",
  history: [],
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
const REWRITE = "### A world full of spirits\n\nThe people of the ancient world did not doubt that spirits were real. Yahuah's people lived among nations whose texts are full of them, and the language of those texts left its mark on Israel's own.\n\nIn Babylon, priests composed long incantations against the spirits believed to bring fever and plague, and guarded doorways with protective images (Black & Green, 1992).\n\n### Names and boundaries\n\nThese spirits had names and distinct roles. They were feared, warded off and bargained with, but not worshipped like the great gods.";

function previewBackend(): StudioBackend {
  let m: Manuscript = JSON.parse(JSON.stringify(SAMPLE));
  const thread: StudioThread = {
    id: "demo", title: "Demonology", createdAt: "", updatedAt: "",
    files: [{ name: "DEMONOLOGY.pdf", storedAs: "DEMONOLOGY.pdf", kind: "original", bytes: 2_400_000, at: "" }, { name: "DEMONOLOGY.txt", storedAs: "DEMONOLOGY.txt", kind: "text", bytes: 600_000, at: "" }, { name: "Demonology notes.docx", storedAs: "Demonology notes.docx", kind: "original", bytes: 84_000, at: "" }],
    outputs: [{ path: "summary.md", bytes: 4200, modifiedAt: new Date().toISOString() }, { path: "quotes-check.md", bytes: 9800, modifiedAt: new Date().toISOString() }],
    messages: [{ id: "m1", role: "user", action: "chat", text: "List every scripture quoted in chapter 3.", at: "" }, { id: "m2", role: "assistant", action: "chat", text: "Saved as **Scripture in chapter 3**: 23 references, with the page of each.", at: "", engine: "claude-code", status: "done" }],
  } as unknown as StudioThread;
  const out: Record<string, string> = { "summary.md": "# Demonology — Summary\n\nA faithful overview of the book.", "quotes-check.md": "# Quotations check\n\nAll quotations verified." };
  const runs: RunOptions[] = [];
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
    cancel: async () => ({}), source: async () => null,
    manuscript: async () => m, saveManuscript: async (_id, x) => { m = x; return x; },
    voice: async () => "", saveVoice: async () => ({}),
  };
}

export default function StudioPreview() {
  const backend = useMemo(previewBackend, []);
  const decision = { active: "claude-code", tone: "ok", reason: "Claude Code is signed in (preview).", fix: null } as unknown as EngineDecision;
  return (
    <Workspace id="demo" backend={backend} decision={decision} mode="auto" onMode={() => {}} onCheckEngine={async () => {}} busy={false} busyElsewhere={false} ready
      citationStyles={["APA 7", "Chicago (notes and bibliography)", "SBL"]} threads={[{ id: "demo", title: "Demonology", files: 2, outputs: 2 }] as never}
      onProject={() => {}} onNewProject={async () => {}} handoff={null} onHandoffUsed={() => {}} onChanged={() => {}} onDeleted={() => {}}
      onWorkInStudio={async () => {}} onLearnVoice={async () => {}} />
  );
}
