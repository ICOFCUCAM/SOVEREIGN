import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FolderOpen, Keyboard, ListTree, PenLine, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Place } from "./Frame";
import { EYEBROW, GRADIENT, SERIF } from "./ui";

export const ONBOARDED = "studio.onboarded";
export const wasOnboarded = () => { try { return localStorage.getItem(ONBOARDED) === "1"; } catch { return true; } };

const STEPS: { place: Place; icon: typeof FolderOpen; title: string; text: string; points: string[] }[] = [
  { place: "sources", icon: FolderOpen, title: "Sources", text: "Start from what you have.", points: ["Upload manuscripts: PDF, Word, text or scans", "Book-wide rules Claude never breaks", "Terminology, forbidden words and your voice"] },
  { place: "plan", icon: ListTree, title: "Plan", text: "Shape the book before writing it.", points: ["Contents and the order of chapters", "An idea and notes for each chapter", "Outline with Claude, or turn it into a series"] },
  { place: "write", icon: PenLine, title: "Write", text: "Write with Claude as your editor.", points: ["Choose how Claude writes: five approaches, each with its source policy", "Every change is a suggestion you accept or reject one by one", "Version history keeps every earlier text"] },
  { place: "finish", icon: Rocket, title: "Finish", text: "Publish with confidence.", points: ["Readiness per format: EPUB, print PDF, paperback, audiobook", "Cover, interior styles and export", "Translate, repurpose and save to your Library"] },
];

// First-project walkthrough (design spec §7): manuscript to publication in
// four steps, then the shortcuts. Shown once per browser; the palette opens it
// again ("How the Studio works").
export default function Onboarding({ open, onClose, onGo }: { open: boolean; onClose: () => void; onGo: (p: Place) => void }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const done = (go?: Place) => { try { localStorage.setItem(ONBOARDED, "1"); } catch { /* per browser */ } setI(0); onClose(); if (go) onGo(go); };
  const last = i === STEPS.length;
  const s = STEPS[i];
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) done(); }}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px] [&>button:last-child]:text-white [&>button:last-child]:opacity-80">
        <div className="bg-[#172033] px-7 pb-6 pt-7 text-white">
          <p className={`${EYEBROW} text-[#94A3B8]`}>How Claude Studio works</p>
          <DialogTitle className={`${SERIF} mt-2 text-[28px] font-medium leading-tight text-white`}>From manuscript to published book</DialogTitle>
          <DialogDescription className="mt-1 text-[14px] text-[#CBD5E1]">Four stages. Move between them at any time; nothing is lost.</DialogDescription>
          <ol className="mt-5 flex items-center gap-2" aria-label="Stages">
            {STEPS.map((x, n) => (
              <li key={x.place} className="flex flex-1 items-center gap-2">
                <button type="button" onClick={() => setI(n)} aria-current={n === i ? "step" : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] transition-colors ${n === i ? "bg-white text-[#172033]" : n < i || last ? "bg-white/15 text-white" : "bg-white/5 text-[#94A3B8] hover:text-white"}`}>
                  <x.icon className="h-3.5 w-3.5" />{x.title}
                </button>
                {n < STEPS.length - 1 && <span aria-hidden className="h-px flex-1 bg-white/15" />}
              </li>
            ))}
          </ol>
        </div>
        <div className="min-h-[220px] px-7 py-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={i} initial={reduce ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -12 }} transition={{ duration: 0.16 }}>
              {last ? (
                <>
                  <p className="flex items-center gap-2 text-[16px] font-semibold"><Keyboard className="h-5 w-5 text-[#2563EB]" /> A few shortcuts</p>
                  <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[14px]">
                    {[["⌘K", "Tools, chapters, results and actions"], ["⌘.", "Focus mode (Esc leaves it)"], ["⌘\\", "Show or hide the Claude panel"], ["⌘Z  ⌘⇧Z", "Undo and redo, outside the text"], ["J  K  X  ⌘↵", "Review Claude's changes"]].map(([k, v]) => (
                      <div key={k} className="contents"><dt><kbd className="rounded border border-[#E6E8ED] bg-[#F8FAFC] px-1.5 py-0.5 font-sans text-[12px] dark:border-white/10 dark:bg-white/5">{k}</kbd></dt><dd className="text-[#475569] dark:text-[#CBD5E1]">{v}</dd></div>
                    ))}
                  </dl>
                </>
              ) : (
                <>
                  <p className="text-[16px] font-semibold">{s.title} · <span className="font-normal text-[#475569] dark:text-[#CBD5E1]">{s.text}</span></p>
                  <ul className="mt-4 space-y-2.5 text-[14px]">{s.points.map((pt) => <li key={pt} className="flex gap-2.5"><span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />{pt}</li>)}</ul>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2 border-t border-[#E6E8ED] px-7 py-4 dark:border-white/10">
          <span className="text-[12px] text-[#64748B]">{Math.min(i + 1, STEPS.length + 1)} of {STEPS.length + 1}</span>
          <Button variant="ghost" className="ml-auto" onClick={() => done()}>Skip</Button>
          {last ? <Button className={GRADIENT} onClick={() => done("sources")}>Start with Sources <ArrowRight className="h-4 w-4" /></Button>
            : <Button onClick={() => setI(i + 1)}>Next <ArrowRight className="h-4 w-4" /></Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
