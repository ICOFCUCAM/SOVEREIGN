import { useEffect, useState } from "react";
import { Loader2, PenLine, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Markdown from "@/components/studio/Markdown";
import type { StudioBackend } from "@/lib/studio-backend";

// My voice: the style guide Claude follows to write like the owner. Learned
// from the owner's own books or samples, readable and editable here, and used
// by "Rewrite in my voice" and every "In my voice" action.
const GRADIENT = "bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] text-white shadow-[0_10px_28px_-12px_hsl(248_83%_55%/0.7)] hover:opacity-95";

export default function VoicePanel({ backend, onGoToBooks }: { backend: StudioBackend; onGoToBooks: () => void }) {
  const { toast } = useToast();
  const [voice, setVoice] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { backend.voice().then((v) => { setVoice(v); setDraft(v); }).catch(() => { setVoice(""); }); }, [backend]);

  const save = async () => {
    setSaving(true);
    try { await backend.saveVoice(draft); setVoice(draft); setEditing(false); toast({ title: "Voice profile saved" }); }
    catch (e) { toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (voice === null) return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold">My voice</h2>
        <p className="mt-1 text-sm text-muted-foreground">How you write, as a style guide Claude follows whenever you choose “In my voice” or “Rewrite in my voice”. It's learned from your own writing, and you can correct it.</p>
      </div>
      {!voice.trim() && !editing ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <PenLine className="mx-auto h-7 w-7 text-primary" />
          <p className="mt-3 font-medium">No voice profile yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Pick a few of your books in My books and choose “Learn my voice”, or upload samples of your writing to a project and run “Learn my voice” from More tools. Then save the result here.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button className={`rounded-full ${GRADIENT}`} onClick={onGoToBooks}>Choose books to learn from</Button>
            <Button variant="outline" className="rounded-full" onClick={() => setEditing(true)}>Write it myself</Button>
          </div>
        </div>
      ) : editing ? (
        <div className="space-y-3">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[50vh] font-mono text-[13px]" aria-label="Voice profile" />
          <div className="flex gap-2">
            <Button className={`rounded-full ${GRADIENT}`} onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile</Button>
            <Button variant="ghost" onClick={() => { setDraft(voice); setEditing(false); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-sm font-semibold">Your voice profile</span>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(true)}>Edit</Button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4"><Markdown text={voice} /></div>
        </div>
      )}
      <div className="flex gap-3 rounded-2xl bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>Writing in your voice makes AI-assisted text read like you, and “[[YOURS: …]]” markers show where your own stories and convictions belong. It doesn't hide AI use: no tool can reliably fool AI detectors, and Amazon KDP asks you to disclose AI-generated content (AI-assisted editing of your own writing doesn't need disclosure). The manuscript's authorship notes record what Claude did, so you can answer accurately.</p>
      </div>
    </div>
  );
}
