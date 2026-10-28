import { useMemo, useState } from "react";
import { Replace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findMatches, replaceMatches, type FindOptions } from "@/lib/find-replace";
import { kindDef, type Manuscript } from "@/lib/manuscript";
import { GRADIENT } from "./ui";

// Find and replace across the book (DESIGN-SPEC.md §21): every match reviewed before anything changes.
export default function FindReplaceDialog({ m, onApply, onClose, onOpenSection }: {
  m: Manuscript; onApply: (next: Manuscript, count: number) => void; onClose: () => void; onOpenSection?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [o, setO] = useState<FindOptions>({ wholeWord: true });
  const matches = useMemo(() => findMatches(m, query, o), [m, query, o]);
  // Matches inside quotations start unticked: a quotation is never changed blindly.
  const [off, setOff] = useState<Set<string>>(new Set());
  const [on, setOn] = useState<Set<string>>(new Set());
  const chosen = matches.filter((x) => (x.quoted ? on.has(x.id) : !off.has(x.id)));
  const toggle = (id: string, quoted: boolean, v: boolean) => {
    const set = quoted ? new Set(on) : new Set(off);
    if (quoted === v) set.add(id); else set.delete(id);
    if (quoted) setOn(set); else setOff(set);
  };
  const all = (v: boolean) => { setOff(v ? new Set() : new Set(matches.filter((x) => !x.quoted).map((x) => x.id))); setOn(v ? new Set(matches.filter((x) => x.quoted).map((x) => x.id)) : new Set()); };
  const titleOf = (id: string) => { const s = m.sections.find((x) => x.id === id); return s?.title || (s ? kindDef(s.kind).label : ""); };
  const quotedCount = matches.filter((x) => x.quoted).length;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl"><Replace className="h-5 w-5 text-primary" /> Find and replace in the book</DialogTitle>
          <DialogDescription>Every match is listed with its context; choose which to change. Each changed section keeps its earlier text in its version history, and Undo works too.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="fr-find">Find</Label><Input id="fr-find" autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setOff(new Set()); setOn(new Set()); }} placeholder="e.g. Jesus" /></div>
          <div className="space-y-1.5"><Label htmlFor="fr-rep">Replace with</Label><Input id="fr-rep" value={replacement} onChange={(e) => setReplacement(e.target.value)} placeholder="e.g. Yahusha" /></div>
        </div>
        <div className="flex flex-wrap gap-4 text-[13px]">
          {([["wholeWord", "Whole words only"], ["caseSensitive", "Match case"], ["titles", "Also in titles"]] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2"><Checkbox checked={Boolean(o[k])} onCheckedChange={(v) => setO({ ...o, [k]: v === true })} />{label}</label>
          ))}
        </div>
        {query && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="font-medium">{matches.length ? `${matches.length} ${matches.length === 1 ? "match" : "matches"} · ${chosen.length} chosen` : "No matches."}</span>
              {matches.length > 0 && <><Button size="sm" variant="ghost" className="h-7" onClick={() => all(true)}>Choose all</Button><Button size="sm" variant="ghost" className="h-7" onClick={() => all(false)}>Choose none</Button></>}
            </div>
            {quotedCount > 0 && <p className="rounded-[10px] border border-amber-200 bg-[#FFFBEB] px-3 py-2 text-[12.5px] dark:border-amber-500/30 dark:bg-amber-500/10">{quotedCount} {quotedCount === 1 ? "match is" : "matches are"} inside a quotation and not chosen: quotations keep their wording unless you choose them.</p>}
            <ol className="max-h-[40vh] space-y-1 overflow-y-auto">
              {matches.map((x, i) => {
                const picked = x.quoted ? on.has(x.id) : !off.has(x.id);
                return (
                  <li key={x.id} className="flex items-start gap-2 rounded-[8px] border border-[#E6E8ED] px-2.5 py-1.5 text-[13px] dark:border-white/10">
                    <Checkbox className="mt-0.5" checked={picked} onCheckedChange={(v) => toggle(x.id, x.quoted, v === true)} aria-label={`Match ${i + 1} in ${titleOf(x.sectionId)}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] text-[#64748B]">{titleOf(x.sectionId)}{x.field === "title" ? " · title" : ""}{x.quoted ? " · in a quotation" : ""}{onOpenSection && <button type="button" className="ml-2 underline" onClick={() => onOpenSection(x.sectionId)}>open</button>}</p>
                      <p className="font-serif">…{x.before}<mark className={picked ? "bg-amber-200 line-through dark:bg-amber-500/40" : "bg-muted"}>{x.text}</mark>{picked && <mark className="bg-emerald-200 dark:bg-emerald-500/40">{replacement}</mark>}{x.after}…</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button className={`rounded-full ${GRADIENT}`} disabled={!chosen.length} onClick={() => onApply(replaceMatches(m, chosen, replacement), chosen.length)}>Replace {chosen.length || ""} {chosen.length === 1 ? "match" : "matches"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
