import { useEffect, useState } from "react";
import { Loader2, Plus, X, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { listCharacters, saveCharacter, deleteCharacter, characterBrief, type StoryCharacter } from "@/lib/characters";

// Character Bible for the Children's Studio. Click a saved character to drop
// their full brief (look, age, personality, relationships) into the story so a
// recurring hero stays consistent across a whole series.
const CharacterLibrary = ({ onInsert }: { onInsert: (brief: string) => void }) => {
  const { toast } = useToast();
  const [chars, setChars] = useState<StoryCharacter[] | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [appearance, setAppearance] = useState("");
  const [age, setAge] = useState("");
  const [personality, setPersonality] = useState("");
  const [relationships, setRelationships] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => { listCharacters().then(setChars).catch(() => setChars([])); };
  useEffect(load, []);

  const add = async () => {
    if (!name.trim() || !appearance.trim()) { toast({ title: "Name and look are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await saveCharacter({ name: name.trim(), appearance: appearance.trim(), age: age.trim(), personality: personality.trim(), relationships: relationships.trim() });
      setName(""); setAppearance(""); setAge(""); setPersonality(""); setRelationships("");
      load();
      toast({ title: "Character saved", description: "Reuse them in any storybook." });
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
            <button type="button" onClick={() => onInsert(characterBrief(c))} className="text-foreground hover:text-primary" title={c.appearance}>{c.name}</button>
            <button type="button" onClick={() => remove(c)} className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${c.name}`}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
              <Users className="mr-1 h-3.5 w-3.5" /> {chars && chars.length > 0 ? "Character bible" : "Save a character"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Character bible</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground font-sans">Save a hero once — look, age, personality and relationships — and reuse them across a whole series. The same brief keeps story and illustrations consistent book to book.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground font-sans">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lina" maxLength={60} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground font-sans">Age</label>
                  <Input value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 6" maxLength={20} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground font-sans">Appearance</label>
                <Textarea value={appearance} onChange={(e) => setAppearance(e.target.value)} placeholder="e.g. curly black hair, big brown eyes, a bright yellow raincoat" rows={2} maxLength={400} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground font-sans">Personality (optional)</label>
                <Input value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="e.g. brave, curious, a little shy at first" maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground font-sans">Relationships (optional)</label>
                <Input value={relationships} onChange={(e) => setRelationships(e.target.value)} placeholder="e.g. little sister to Theo; best friend of Pip the fox" maxLength={200} />
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
                      <div className="text-sm font-medium font-sans">{c.name}{c.age ? <span className="text-muted-foreground"> · age {c.age}</span> : null}</div>
                      <div className="truncate text-xs text-muted-foreground font-sans">{c.appearance}{c.personality ? ` · ${c.personality}` : ""}</div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" variant="heroOutline" size="sm" onClick={() => { onInsert(characterBrief(c)); setOpen(false); }}>Insert</Button>
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
