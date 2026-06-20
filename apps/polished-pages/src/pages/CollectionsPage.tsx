import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderPlus, Loader2, Trash2, Globe, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { listCollections, createCollection, deleteCollection, setCollectionPublic, type Collection } from "@/lib/collections";

const CollectionsPage = () => {
  const { toast } = useToast();
  const [cols, setCols] = useState<Collection[] | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => { listCollections().then(setCols).catch((e) => { toast({ title: "Could not load", description: e.message, variant: "destructive" }); setCols([]); }); };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    if (title.trim().length < 2) return;
    setBusy(true);
    try { await createCollection(title); setTitle(""); load(); }
    catch (e) { toast({ title: "Could not create", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const remove = async (c: Collection) => {
    try { await deleteCollection(c.id); setCols((p) => p?.filter((x) => x.id !== c.id) ?? null); }
    catch (e) { toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const togglePublic = async (c: Collection) => {
    try {
      const token = await setCollectionPublic(c.id, !c.public);
      setCols((p) => p?.map((x) => (x.id === c.id ? { ...x, public: !c.public, share_token: token } : x)) ?? null);
      if (!c.public && token) {
        const url = `${window.location.origin}/collection/${token}`;
        await navigator.clipboard.writeText(url).catch(() => {});
        toast({ title: "Collection is public", description: "Link copied to clipboard." });
      }
    } catch (e) { toast({ title: "Could not update", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const copyLink = async (c: Collection) => {
    if (!c.share_token) return;
    const url = `${window.location.origin}/collection/${c.share_token}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(c.id); setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Collections</h1>
        <p className="mt-1 text-muted-foreground font-sans">Group your documents into sets — and publish a collection as a public, shareable page. Add items from the Library.</p>
      </motion.div>

      <div className="mt-6 flex items-center gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New collection name (e.g. Grade 4 Science)" maxLength={80} />
        <Button variant="hero" disabled={busy || title.trim().length < 2} onClick={create}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="mr-1 h-4 w-4" />} Create
        </Button>
      </div>

      {cols === null && <div className="mt-10 flex items-center gap-2 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {cols && cols.length === 0 && <p className="mt-8 text-center text-sm text-muted-foreground font-sans">No collections yet.</p>}
      {cols && cols.length > 0 && (
        <div className="mt-6 space-y-3">
          {cols.map((c) => (
            <Card key={c.id} className="border-border">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="font-sans font-semibold">{c.title}</div>
                  <div className="text-xs text-muted-foreground font-sans">{c.item_count} item{c.item_count === 1 ? "" : "s"}{c.public ? " · Public" : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={c.public ? "hero" : "heroOutline"} size="sm" onClick={() => togglePublic(c)}>
                    <Globe className="mr-1 h-4 w-4" /> {c.public ? "Public" : "Make public"}
                  </Button>
                  {c.public && c.share_token && (
                    <Button variant="heroOutline" size="sm" onClick={() => copyLink(c)}>{copied === c.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => remove(c)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
