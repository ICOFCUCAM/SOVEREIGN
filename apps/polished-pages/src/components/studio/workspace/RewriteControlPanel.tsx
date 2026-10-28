import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Copy, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ALL_IDS, DEFAULT_CONFIG, DEMONOLOGY_TRANSFORMATION, GROUPS, PRESETS, auditOnly, buildInstruction, keepConfig, loadConfig, presetState, restructures, saveAsDefault,
  type PanelConfig, type PresetId,
} from "@/lib/rewrite-panel";
import { GRADIENT } from "./ui";

// The Book Rewrite Control Panel (DESIGN-SPEC.md §20): every editorial operation as a
// checkbox, presets, approval or autonomous workflow, the project's details, and one
// readable instruction built from the choices, previewed before it is used or copied.
export interface PanelResult { instructions: string; keepStructure: boolean; approval: boolean; auditOnly: boolean; language?: string; audience?: string }

export default function RewriteControlPanel({ projectId, defaults, sourceLabel, claudeCode, onUse, onClose }: {
  projectId: string;
  /** The project's title and the book's rules, used when nothing is saved yet. */
  defaults: { title?: string; terminology?: string };
  /** What the rewrite works on (chosen in the Rewrite dialog). */
  sourceLabel: string;
  /** Approval mode and audit-only runs need Claude Code. */
  claudeCode: boolean;
  onUse: (r: PanelResult) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [c, setC] = useState<PanelConfig>(() => {
    const saved = loadConfig(projectId);
    return { ...saved, title: saved.title || defaults.title || "", terminology: saved.terminology || defaults.terminology || "" };
  });
  const [open, setOpen] = useState<Record<string, boolean>>({ a: true });
  const [verbatim, setVerbatim] = useState(false);
  // Kept as it is left, for this project (moving between sections or closing keeps it).
  useEffect(() => { keepConfig(projectId, c); }, [projectId, c]);
  const set = (p: Partial<PanelConfig>) => setC((x) => ({ ...x, ...p }));
  const ps = presetState(c);
  const toggle = (id: string, on: boolean) => {
    if (id === "b10") { set({ workflow: on ? "approval" : "autonomous" }); return; }
    setC((x) => ({ ...x, selected: on ? [...new Set([...x.selected, id])] : x.selected.filter((y) => y !== id) }));
  };
  const checked = (id: string) => (id === "b10" ? c.workflow === "approval" : c.selected.includes(id));
  const choosePreset = (id: PresetId) => {
    // A preset never silently replaces choices made by hand.
    if (ps.modified && !window.confirm(`You changed the selections of “${PRESETS.find((p) => p.id === c.preset)?.label}” by hand. Replace them with “${PRESETS.find((p) => p.id === id)?.label}”?`)) return;
    const p = PRESETS.find((x) => x.id === id)!;
    set({ preset: id, ...(id === "custom" ? {} : { selected: p.ids }) });
    setVerbatim(false);
  };
  const instruction = useMemo(() => (verbatim ? DEMONOLOGY_TRANSFORMATION : buildInstruction(c)), [c, verbatim]);
  const count = ALL_IDS.filter((id) => checked(id)).length;
  const needsClaude = !claudeCode && (c.workflow === "approval" || auditOnly(c));
  const copy = async () => { try { await navigator.clipboard.writeText(instruction); toast({ title: "Copied", description: "The instruction is on your clipboard." }); } catch { toast({ title: "Couldn't copy", variant: "destructive" }); } };
  const use = () => onUse({ instructions: instruction, keepStructure: verbatim ? false : !restructures(c), approval: c.workflow === "approval" && !(!verbatim && auditOnly(c)), auditOnly: !verbatim && auditOnly(c), language: c.language.trim() || undefined, audience: c.audience.trim() || undefined });

  const field = (id: keyof PanelConfig, label: string, placeholder = "") => (
    <div className="space-y-1"><Label htmlFor={`rcp-${id}`} className="text-[12.5px]">{label}</Label>
      <Input id={`rcp-${id}`} value={String(c[id] ?? "")} onChange={(e) => set({ [id]: e.target.value } as Partial<PanelConfig>)} placeholder={placeholder} className="h-9" /></div>
  );

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[94vh] overflow-hidden p-0 sm:max-w-6xl">
        <div className="grid max-h-[94vh] md:grid-cols-[1.15fr_1fr]">
          <div className="overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif text-2xl"><SlidersHorizontal className="h-5 w-5 text-primary" /> Book Rewrite Control Panel</DialogTitle>
              <DialogDescription>Choose exactly what Claude does to the book. The panel writes one instruction from your choices; nothing starts until you use it in the Rewrite dialog and press Start.</DialogDescription>
            </DialogHeader>

            <section className="mt-5 space-y-3" aria-label="Project">
              <p className="text-[13px] font-semibold">The project</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {field("title", "Book title")}{field("subtitle", "Subtitle")}
                {field("author", "Author (optional)")}{field("language", "Language", "Same as the manuscript")}
                {field("audience", "Readers", "e.g. Bible-school students")}{field("format", "Publishing format", "e.g. Paperback and e-book")}
                {field("versionName", "Name of this version", "e.g. Transformation, first pass")}
                <div className="space-y-1"><p className="text-[12.5px] font-medium">Source and output</p><p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12.5px]">Works on: {sourceLabel}. Saved in this project's Results (the rewritten book and its reports), each run a new version; the original is never changed.</p></div>
              </div>
              <div className="space-y-1"><Label htmlFor="rcp-notes" className="text-[12.5px]">Project notes</Label><Textarea id="rcp-notes" rows={2} value={c.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Anything Claude should know about this book." /></div>
              <div className="space-y-1"><Label htmlFor="rcp-terms" className="text-[12.5px]">Terminology rules (for “Apply the project's approved divine-name terminology”)</Label><Textarea id="rcp-terms" rows={3} value={c.terminology} onChange={(e) => set({ terminology: e.target.value })} placeholder={"e.g. Replace Jesus with Yahusha.\nReplace God, Yahweh, Lord and Jehovah with Yahuah where they refer to the divine being."} /></div>
            </section>

            <section className="mt-6 space-y-2" aria-label="Workflow">
              <p className="text-[13px] font-semibold">Workflow</p>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                {([["approval", "Approval mode", "Claude analyses the whole book, proposes the new contents and plan, and stops. You read it and approve; then the rewrite runs from that plan."], ["autonomous", "Autonomous mode", "Claude analyses, restructures, rewrites, integrates and audits in one run, stopping only where a decision can't be inferred."]] as const).map(([id, label, line]) => (
                  <button key={id} type="button" role="radio" aria-checked={c.workflow === id} onClick={() => set({ workflow: id })}
                    className={`rounded-[10px] border px-3 py-2.5 text-left ${c.workflow === id ? "border-[#2563EB] bg-[#EAF1FF] dark:bg-[#1E3A8A]/30" : "border-border hover:bg-muted/50"}`}>
                    <span className="block text-[13.5px] font-medium">{label}</span><span className="mt-0.5 block text-[12px] text-[#64748B]">{line}</span>
                  </button>
                ))}
              </div>
              {needsClaude && <p className="text-[12px] text-[#B45309]">{auditOnly(c) ? "An audit without rewriting" : "Approval mode"} needs Claude Code: switch the engine to Claude Code before you start.</p>}
            </section>

            <section className="mt-6 space-y-2" aria-label="Presets">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-semibold">Preset</p>
                <span className="text-[12px] text-[#64748B]">{c.preset === "custom" ? "Custom" : `${PRESETS.find((p) => p.id === c.preset)?.label}${ps.modified ? " (changed by hand)" : ""}`} · {count} of {ALL_IDS.length} operations</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => <button key={p.id} type="button" title={p.line} aria-pressed={c.preset === p.id} onClick={() => choosePreset(p.id)} className={`rounded-full border px-2.5 py-1 text-[12px] ${c.preset === p.id ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted"}`}>{p.label}</button>)}
              </div>
              <p className="text-[12px] text-[#64748B]">{PRESETS.find((p) => p.id === c.preset)?.line}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Button size="sm" variant="ghost" onClick={() => set({ preset: "custom", selected: ALL_IDS.filter((i) => i !== "b10") })}>Select all</Button>
                <Button size="sm" variant="ghost" onClick={() => set({ preset: "custom", selected: [] })}>Clear all</Button>
                <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Reset every choice in the panel to the defaults?")) { setC({ ...DEFAULT_CONFIG, title: defaults.title ?? "", terminology: defaults.terminology ?? "" }); setVerbatim(false); } }}><RotateCcw className="h-3.5 w-3.5" /> Reset to defaults</Button>
                <Button size="sm" variant="ghost" onClick={() => { saveAsDefault(c); toast({ title: "Configuration saved", description: "New projects start with these choices; this project keeps its own." }); }}><Save className="h-3.5 w-3.5" /> Save as my default</Button>
              </div>
            </section>

            <section className="mt-4 space-y-2" aria-label="Operations">
              {GROUPS.map((g) => {
                const n = g.options.filter((x) => checked(x.id)).length;
                return (
                  <div key={g.id} className="rounded-[10px] border border-border">
                    <button type="button" aria-expanded={Boolean(open[g.id])} onClick={() => setOpen((x) => ({ ...x, [g.id]: !x[g.id] }))} className="flex w-full items-center justify-between px-3 py-2.5 text-left">
                      <span className="text-[13.5px] font-medium">{g.title}</span>
                      <span className="flex items-center gap-2 text-[12px] text-[#64748B]">{n} of {g.options.length}<ChevronDown className={`h-4 w-4 transition-transform ${open[g.id] ? "rotate-180" : ""}`} /></span>
                    </button>
                    {open[g.id] && (
                      <ul className="space-y-2 border-t border-border px-3 py-3">
                        {g.options.map((x) => (
                          <li key={x.id} className="flex items-start gap-2.5">
                            <Checkbox id={`op-${x.id}`} checked={checked(x.id)} onCheckedChange={(v) => toggle(x.id, v === true)} className="mt-0.5" />
                            <label htmlFor={`op-${x.id}`} className="text-[13px] leading-snug"><span className="font-medium">{x.label}</span><span className="block text-[12px] text-[#64748B]">{x.help}</span></label>
                          </li>
                        ))}
                        {g.id === "f" && <li className="pl-6"><Label htmlFor="rcp-words" className="text-[12px]">Target word count (optional)</Label><Input id="rcp-words" inputMode="numeric" value={c.targetWords} onChange={(e) => set({ targetWords: e.target.value.replace(/[^\d,. ]/g, "") })} className="mt-1 h-8 w-40" placeholder="e.g. 60,000" /></li>}
                      </ul>
                    )}
                  </div>
                );
              })}
            </section>
          </div>

          <aside className="flex min-h-0 flex-col border-t border-border bg-muted/30 p-6 md:border-l md:border-t-0">
            <p className="text-[13px] font-semibold">The instruction Claude will follow</p>
            <div className="mt-2 rounded-[10px] border border-border bg-background p-2.5 text-[12.5px]">
              <label className="flex items-start gap-2"><Checkbox checked={verbatim} onCheckedChange={(v) => setVerbatim(v === true)} className="mt-0.5" />
                <span><span className="font-medium">Use my “Complete Book Transformation — Demonology: The Battle of Angels” instruction, word for word</span><span className="block text-[12px] text-[#64748B]">Your own instruction, as you wrote it, instead of the one built from the checkboxes. It asks for the new table of contents first.</span></span></label>
            </div>
            <pre aria-label="Preview of the instruction" className="mt-3 min-h-[240px] flex-1 overflow-y-auto whitespace-pre-wrap rounded-[10px] border border-border bg-background p-3 font-sans text-[12.5px] leading-relaxed">{instruction}</pre>
            <p className="mt-2 text-[12px] text-[#64748B]">{instruction.split(/\s+/).length.toLocaleString()} words. Claude also follows the Studio's rewriting standard (rewrite, do not copy; scripture and quotations word for word; nothing invented).</p>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button variant="outline" onClick={copy}><Copy className="h-4 w-4" /> Copy</Button>
              <Button className={`rounded-full ${GRADIENT}`} disabled={!verbatim && count === 0} onClick={use}><Check className="h-4 w-4" /> Use this instruction</Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
