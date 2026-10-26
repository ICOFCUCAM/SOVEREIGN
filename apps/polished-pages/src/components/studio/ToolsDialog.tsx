import { useMemo, useState } from "react";
import { ArrowLeft, AudioLines, Layers3, BadgeCheck, Feather, BookMarked, Gauge, GitCompare, Globe, GraduationCap, Languages, ListTree, Megaphone, ScanText, SpellCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STUDIO_TOOLS, type StudioTool } from "@/lib/studio-tools";
import { outputLabel, type RunOptions, type StudioThread } from "@/lib/claude-studio";
import type { EngineId } from "@/lib/studio-backend";

// The "More tools" window: pick a tool, set its few options, run it on the
// engine in use (shown), on the uploads or on an earlier result.
const ICONS: Record<StudioTool["icon"], typeof SpellCheck2> = { series: Layers3, voice: AudioLines, pen: Feather, spell: SpellCheck2, check: BadgeCheck, quote: BookMarked, languages: Languages, megaphone: Megaphone, graduation: GraduationCap, list: ListTree, diff: GitCompare, gauge: Gauge, scan: ScanText };
const GRADIENT = "bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] text-white shadow-[0_10px_28px_-12px_hsl(248_83%_55%/0.7)] hover:opacity-95";

export default function ToolsDialog({ thread, engine, onClose, onRun }: { thread: StudioThread; engine: EngineId | null; onClose: () => void; onRun: (o: RunOptions & Record<string, unknown>) => void }) {
  const [tool, setTool] = useState<StudioTool | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [target, setTarget] = useState("source");

  // Everything in the project that a tool can read: uploads (their text, where read) and results.
  const sources = useMemo(() => {
    const originals = thread.files.filter((f) => f.kind === "original").map((f) => {
      const txt = thread.files.find((x) => x.kind === "text" && x.storedAs === f.storedAs.replace(/\.[^.]+$/, "") + ".txt");
      return { v: `source/${(txt ?? f).storedAs}`, l: `Upload · ${f.name}` };
    });
    const outs = thread.outputs.filter((o) => !o.path.endsWith(".json")).map((o) => ({ v: `out/${o.path}`, l: `Result · ${outputLabel(o.path)}` }));
    return [...originals, ...outs];
  }, [thread]);
  const targets = useMemo(() => [...(thread.files.length ? [{ v: "source", l: "My uploaded documents" }] : []), ...thread.outputs.filter((x) => !x.path.startsWith("rewrite/") && !x.path.endsWith(".json")).map((x) => ({ v: x.path, l: `Result · ${outputLabel(x.path)}` }))], [thread]);

  const pick = (t: StudioTool) => {
    const init: Record<string, unknown> = {};
    for (const f of t.fields) if (f.initial !== undefined) init[f.key] = f.initial;
    if (t.pair) { init.a = sources[0]?.v; init.b = sources[1]?.v ?? sources[0]?.v; }
    setValues(init); setTool(t); setTarget(targets[0]?.v ?? "source");
  };
  const set = (k: string, v: unknown) => setValues((x) => ({ ...x, [k]: v }));
  const unavailable = tool?.claudeOnly && engine !== "claude-code";
  const missing = tool?.id === "translate" && !String(values.language ?? "").trim() ? "Say which language." : tool?.pair && (!values.a || !values.b || values.a === values.b) ? "Choose two different versions." : null;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {!tool ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">More tools</DialogTitle>
              <DialogDescription>Each tool works on your uploads or an earlier result and writes its own file into the project's results.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {STUDIO_TOOLS.map((t) => {
                const I = ICONS[t.icon];
                const off = t.claudeOnly && engine !== "claude-code";
                return (
                  <button key={t.id} type="button" onClick={() => pick(t)} data-tool={t.id}
                    className={`flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:shadow-sm ${off ? "opacity-60" : ""}`}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><I className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{t.title}</span>
                      <span className="block text-xs text-muted-foreground">{t.line}</span>
                      {t.web && <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary"><Globe className="h-3 w-3" /> Searches the web</span>}
                      {off && <span className="mt-1 block text-[11px] text-amber-700 dark:text-amber-400">Needs Claude Code</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <button type="button" onClick={() => setTool(null)} className="mb-1 inline-flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> All tools</button>
              <DialogTitle className="font-serif text-2xl">{tool.title}</DialogTitle>
              <DialogDescription>{tool.line}. Writes “{outputLabel(tool.output(values))}”.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!tool.pair && targets.length > 0 && (
                <div className="space-y-1.5"><Label>Work on</Label>
                  <Select value={target} onValueChange={setTarget}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{targets.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent></Select></div>
              )}
              {tool.fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  {f.type === "toggle" ? (
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"><span>{f.label}</span><Switch checked={values[f.key] !== false} onCheckedChange={(v) => set(f.key, v)} /></label>
                  ) : (<>
                    <Label htmlFor={`tool-${f.key}`}>{f.label}</Label>
                    {f.type === "select" ? (
                      <Select value={String(values[f.key] ?? "") || "__"} onValueChange={(v) => set(f.key, v === "__" ? "" : v)}>
                        <SelectTrigger id={`tool-${f.key}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{f.options!.map((o) => <SelectItem key={o.v || "__"} value={o.v || "__"}>{o.l}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : f.type === "source" ? (
                      <Select value={String(values[f.key] ?? "")} onValueChange={(v) => set(f.key, v)}>
                        <SelectTrigger id={`tool-${f.key}`}><SelectValue placeholder="Choose a file" /></SelectTrigger>
                        <SelectContent>{sources.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input id={`tool-${f.key}`} type={f.type === "number" ? "number" : "text"} min={f.type === "number" ? 1 : undefined} max={f.type === "number" ? 20 : undefined}
                        value={String(values[f.key] ?? "")} placeholder={f.placeholder} onChange={(e) => set(f.key, f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} />
                    )}
                  </>)}
                </div>
              ))}
              <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {unavailable ? "This tool needs your Claude Code: it reads the scanned images itself. It's unavailable while the engine is the API."
                  : engine === "api" ? "Runs on the API, chapter by chapter. Billed per use." : "Runs on your Claude Code, on your plan."}
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              {missing && <span className="mr-auto self-center text-xs text-destructive">{missing}</span>}
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button className={`rounded-full ${GRADIENT}`} disabled={Boolean(unavailable) || Boolean(missing) || !engine}
                onClick={() => onRun({ ...values, tool: tool.id, ...(tool.pair ? {} : { target }) } as RunOptions & Record<string, unknown>)}>
                Start {tool.title.toLowerCase()}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
