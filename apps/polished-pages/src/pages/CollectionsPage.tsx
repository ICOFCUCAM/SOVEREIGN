import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderPlus, Loader2, Trash2, Globe, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
        <h1 className="font-serif text-3xl font-bold tracking-tight">Collections &amp; shared libraries</h1>
        <p className="mt-1 text-muted-foreground font-sans">Group your work into curated sets — then publish a collection as a public, shareable repository for a class, a team or the world. Add items from the Library.</p>
      </motion.div>

      <div className="mt-6 flex items-center gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New collection name (e.g. Grade 4 Science)" maxLength={80} />
        <Button variant="hero" disabled={busy || title.trim().length < 2} onClick={create}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="mr-1 h-4 w-4" />} Create
        </Button>
      </div>

      {cols === null && (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border p-4 flex items-center justify-between gap-3">
              <div className="flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="mt-1.5 h-3 w-24" /></div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </div>
      )}
      {cols && cols.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-border/60 p-10 text-center">
          <FolderPlus className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium font-sans">No collections yet</p>
          <p className="mt-1 text-sm text-muted-foreground font-sans">Create one above, then add documents to it from your Library.</p>
        </div>
      )}
      {cols && cols.length > 0 && (
        <div className="mt-6 space-y-3">
          {cols.map((c) => (
            <Card key={c.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-sans font-semibold">
                      {c.title}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${c.public ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{c.public ? "Public" : "Private"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-sans">{c.item_count} item{c.item_count === 1 ? "" : "s"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant={c.public ? "hero" : "heroOutline"} size="sm" onClick={() => togglePublic(c)}>
                      <Globe className="mr-1 h-4 w-4" /> {c.public ? "Public" : "Make public"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => remove(c)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {c.public && c.share_token && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1">
                    <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground font-sans">{`${window.location.origin}/collection/${c.share_token}`}</span>
                    <button onClick={() => copyLink(c)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-primary" title="Copy link">
                      {copied === c.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
