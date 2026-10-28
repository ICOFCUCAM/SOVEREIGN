import { useEffect, useRef, useState } from "react";
import { Layers, Mic, Paperclip, Plus, ScrollText, Send, Square, Wand2, Wrench } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { kindDef, type Manuscript } from "@/lib/manuscript";
import type { DialogAction } from "./parts";
import { GRADIENT } from "./ui";

// Ask Claude about a chapter (DESIGN-SPEC.md §21): the chat bar at the foot of the page. The chosen
// section goes with the question (Claude reads it in the project); the answer opens in the panel's
// conversation. "+" holds the whole-book actions; the microphone dictates where the browser can.
type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null };
const SpeechRec = (): (new () => Recognition) | null => (typeof window === "undefined" ? null : ((window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition ?? null));

export default function ChapterChat({ m, sectionId, engineLabel, busy, running, onStop, onSend, onAction, onJoin, onTool, onConversation }: {
  m: Manuscript; sectionId: string | null; engineLabel: string; busy: boolean; running: boolean;
  onStop: () => void; onSend: (message: string) => void; onAction: (a: DialogAction) => void; onJoin: () => void; onTool: () => void; onConversation: () => void;
}) {
  const [text, setText] = useState("");
  const [about, setAbout] = useState<string>(sectionId ?? "book");
  useEffect(() => { if (sectionId) setAbout(sectionId); }, [sectionId]);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const Rec = SpeechRec();
  const chapters = m.sections.filter((s) => s.kind === "chapter");
  const label = (id: string) => { const s = m.sections.find((x) => x.id === id); if (!s) return "The whole book"; const n = chapters.indexOf(s) + 1; return `${n ? `Chapter ${n} · ` : `${kindDef(s.kind).label} · `}${s.title}`; };
  const send = () => {
    const q = text.trim(); if (!q || busy) return;
    const s = m.sections.find((x) => x.id === about);
    const n = s ? chapters.indexOf(s) + 1 : 0;
    onSend(s ? `About the section “${s.title}”${n ? ` (chapter ${n})` : ""}: ${q}` : q);
    setText("");
  };
  const dictate = () => {
    if (!Rec) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new Rec(); r.lang = navigator.language || "en-US"; r.interimResults = false; r.continuous = false;
    r.onresult = (e) => { const said = Array.from(e.results).map((x) => x[0].transcript).join(" "); setText((t) => (t ? `${t} ${said}` : said)); };
    r.onend = () => setListening(false);
    rec.current = r; setListening(true); r.start();
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); send(); }} aria-label="Ask Claude" className="sticky bottom-0 z-20 mx-auto mt-10 w-full max-w-[860px] pb-3 pt-2">
      <div className="rounded-[16px] border border-[#E6E8ED] bg-white p-2 shadow-[0_8px_30px_-12px_rgba(15,23,42,.25)] dark:border-white/10 dark:bg-[#11151C]">
        <div className="flex items-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button type="button" aria-label="Whole-book actions" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#475569] hover:bg-[#F1F5F9] dark:text-[#CBD5E1] dark:hover:bg-white/10"><Plus className="h-5 w-5" /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
              <DropdownMenuItem className="gap-2" onSelect={() => onAction("summarize")}><ScrollText className="h-4 w-4" /> Summarise the book</DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onSelect={() => onAction("rewrite")}><Wand2 className="h-4 w-4" /> Rewrite the book</DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onSelect={onJoin}><Layers className="h-4 w-4" /> Join files</DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onSelect={onTool}><Wrench className="h-4 w-4" /> More tools</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} aria-label="Ask Claude about this chapter" placeholder="Ask Claude about this chapter, request a revision, or discuss an argument…"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            className="max-h-40 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-[15px] shadow-none focus-visible:ring-0" />
          {running && <button type="button" onClick={onStop} aria-label="Stop Claude" title="Stop" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#172033] hover:bg-[#F1F5F9] dark:text-white dark:hover:bg-white/10"><Square className="h-4 w-4 fill-current" /></button>}
          {Rec && <button type="button" onClick={dictate} aria-pressed={listening} aria-label={listening ? "Stop dictating" : "Dictate"} title="Dictate" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-[#F1F5F9] dark:hover:bg-white/10 ${listening ? "text-[#DC2626]" : "text-[#475569] dark:text-[#CBD5E1]"}`}><Mic className="h-4.5 w-4.5" /></button>}
          <button type="submit" aria-label="Send" disabled={!text.trim() || busy} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full disabled:opacity-40 ${GRADIENT}`}><Send className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-[12.5px] text-[#64748B]">
        <select aria-label="What the question is about" value={about} onChange={(e) => setAbout(e.target.value)} className="h-7 max-w-[260px] truncate rounded-md border-0 bg-transparent pr-1 font-medium text-[#4F46E5] hover:bg-[#EEF2FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:text-[#A5B4FC] dark:hover:bg-white/5">
          {m.sections.map((s) => <option key={s.id} value={s.id}>{label(s.id)}</option>)}
          <option value="book">The whole book</option>
        </select>
        <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {about === "book" ? "The whole book" : "Current section attached"}</span>
        <button type="button" onClick={onConversation} className="font-medium text-[#2563EB] hover:underline">Conversation</button>
        <span className="ml-auto">{engineLabel}</span>
      </div>
    </form>
  );
}
