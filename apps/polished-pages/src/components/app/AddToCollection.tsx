import { useState } from "react";
import { Loader2, Plus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { listCollections, collectionsForDocument, setCollectionItem, createCollection, type Collection } from "@/lib/collections";

const AddToCollection = ({ documentId, trigger }: { documentId: string; trigger: React.ReactNode }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState<Collection[] | null>(null);
  const [member, setMember] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const load = async () => {
    try {
      const [c, m] = await Promise.all([listCollections(), collectionsForDocument(documentId)]);
      setCols(c); setMember(new Set(m));
    } catch (e) { toast({ title: "Could not load collections", description: e instanceof Error ? e.message : "", variant: "destructive" }); setCols([]); }
  };

  const toggle = async (c: Collection) => {
    const add = !member.has(c.id);
    setBusy(c.id);
    try {
      await setCollectionItem(c.id, documentId, add);
      setMember((prev) => { const n = new Set(prev); if (add) n.add(c.id); else n.delete(c.id); return n; });
      setCols((prev) => prev?.map((x) => (x.id === c.id ? { ...x, item_count: x.item_count + (add ? 1 : -1) } : x)) ?? null);
    } catch (e) { toast({ title: "Could not update", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const create = async () => {
    if (newTitle.trim().length < 2) return;
    setBusy("new");
    try {
      const id = await createCollection(newTitle);
      await setCollectionItem(id, documentId, true);
      setNewTitle("");
      await load();
      toast({ title: "Collection created", description: "Added to your new collection." });
    } catch (e) { toast({ title: "Could not create", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setCols(null); load(); } }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Add to collection</DialogTitle>
          <DialogDescription>Organize your work into collections — and publish a collection as a public set.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {cols === null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : cols.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No collections yet — create one below.</p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-auto">
              {cols.map((c) => (
                <button key={c.id} onClick={() => toggle(c)} disabled={busy === c.id} className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm font-sans hover:border-primary/40">
                  <span><span className="font-medium">{c.title}</span> <span className="text-xs text-muted-foreground">· {c.item_count} item{c.item_count === 1 ? "" : "s"}</span></span>
                  {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : member.has(c.id) ? <Check className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New collection name" maxLength={80} />
            <Button variant="heroOutline" size="sm" disabled={busy === "new" || newTitle.trim().length < 2} onClick={create}>
              {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCollection;
