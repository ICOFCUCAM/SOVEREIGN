import { useEffect, useState } from "react";
import { Loader2, Plus, X, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { listCharacters, saveCharacter, deleteCharacter, type StoryCharacter } from "@/lib/characters";

// Reusable cast for the Children's Studio. Click a saved character to drop it
// into the story's characters field so a recurring hero stays consistent across
// books; add or remove characters from the small dialog.
const CharacterLibrary = ({ onInsert }: { onInsert: (name: string, appearance: string) => void }) => {
  const { toast } = useToast();
  const [chars, setChars] = useState<StoryCharacter[] | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [appearance, setAppearance] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => { listCharacters().then(setChars).catch(() => setChars([])); };
  useEffect(load, []);

  const add = async () => {
    if (!name.trim() || !appearance.trim()) { toast({ title: "Name and look are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await saveCharacter(name.trim(), appearance.trim());
      setName(""); setAppearance("");
      load();
      toast({ title: "Character saved", description: "Reuse it in any storybook." });
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (c: StoryCharacter) => {
    setChars((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
    try { await deleteCharacter(c.id); } catch { load(); }
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {(chars ?? []).map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-sans">
            <button type="button" onClick={() => onInsert(c.name, c.appearance)} className="text-foreground hover:text-primary" title={c.appearance}>{c.name}</button>
            <button type="button" onClick={() => remove(c)} className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${c.name}`}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
              <Users className="mr-1 h-3.5 w-3.5" /> {chars && chars.length > 0 ? "Manage characters" : "Save a character"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Character library</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground font-sans">Save a hero once and reuse them across a whole series — the same name and look keep illustrations consistent book to book.</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground font-sans">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lina" maxLength={60} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground font-sans">Appearance</label>
                <Textarea value={appearance} onChange={(e) => setAppearance(e.target.value)} placeholder="e.g. a 6-year-old girl with curly black hair, big brown eyes and a bright yellow raincoat" rows={2} maxLength={400} className="resize-none" />
              </div>
              <Button type="button" variant="hero" size="sm" onClick={add} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Save character
              </Button>
            </div>
            {chars && chars.length > 0 && (
              <div className="mt-2 max-h-52 space-y-2 overflow-y-auto border-t border-border pt-3">
                {chars.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium font-sans">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground font-sans">{c.appearance}</div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" variant="heroOutline" size="sm" onClick={() => { onInsert(c.name, c.appearance); setOpen(false); }}>Insert</Button>
                      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => remove(c)}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CharacterLibrary;
