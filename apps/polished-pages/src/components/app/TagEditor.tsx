import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { setTags } from "@/lib/documents";

const TagEditor = ({ documentId, current, trigger, onSaved }: { documentId: string; current: string[]; trigger: React.ReactNode; onSaved?: (tags: string[]) => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current.join(", "));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const tags = Array.from(new Set(value.split(",").map((t) => t.trim()).filter(Boolean))).slice(0, 20);
      await setTags(documentId, tags);
      onSaved?.(tags);
      setOpen(false);
      toast({ title: "Tags saved" });
    } catch (e) {
      toast({ title: "Could not save tags", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(current.join(", ")); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Tags</DialogTitle>
          <DialogDescription>Comma-separated tags to organize and filter your Library.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. grade 4, science, draft" />
          <Button variant="hero" className="w-full" disabled={busy} onClick={save}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save tags"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagEditor;
