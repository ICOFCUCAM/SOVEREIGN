import { useState } from "react";
import { ImageIcon, Loader2, Download, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authHeader } from "@/lib/session";

type Side = "front" | "back";

// AI cover + back-cover design via OpenAI gpt-image-1 (the platform's image
// engine; Claude has no image model). One side per request. The author's
// instructions drive the art direction; the title/blurb are passed for context.
const CoverGenerator = ({ title, subtitle }: { title?: string; subtitle?: string }) => {
  const { toast } = useToast();
  const [author, setAuthor] = useState("");
  const [blurb, setBlurb] = useState("");
  const [instr, setInstr] = useState<Record<Side, string>>({ front: "", back: "" });
  const [img, setImg] = useState<Record<Side, string | null>>({ front: null, back: null });
  const [busy, setBusy] = useState<Side | null>(null);

  const generate = async (side: Side) => {
    setBusy(side);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-book-cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ side, instruction: instr[side], title, subtitle, author, blurb }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Cover generation failed");
      }
      const data = await res.json();
      setImg((p) => ({ ...p, [side]: data.image as string }));
    } catch (e) {
      toast({ title: "Could not generate cover", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const download = (side: Side) => {
    const src = img[side];
    if (!src) return;
    const a = document.createElement("a");
    a.href = src; a.download = `book-${side}-cover.png`; a.click();
  };

  const Panel = ({ side, label }: { side: Side; label: string }) => (
    <Card className="border-border">
      <CardHeader className="pb-3"><CardTitle className="font-serif text-base">{label}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30">
          {busy === side ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-sans">Designing…</span>
            </div>
          ) : img[side] ? (
            <img src={img[side]!} alt={`${label}`} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          )}
        </div>
        <Textarea
          placeholder={side === "front" ? "Art direction for the front cover (mood, imagery, colours, style)…" : "Art direction for the back cover…"}
          value={instr[side]}
          onChange={(e) => setInstr((p) => ({ ...p, [side]: e.target.value }))}
          rows={3}
          maxLength={1200}
          className="resize-none text-sm"
        />
        <div className="flex gap-2">
          <Button variant="hero" size="sm" className="flex-1" disabled={busy !== null} onClick={() => generate(side)}>
            {busy === side ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            {img[side] ? "Regenerate" : "Generate"}
          </Button>
          {img[side] && (
            <Button variant="heroOutline" size="sm" onClick={() => download(side)}>
              <Download className="mr-1 h-4 w-4" /> PNG
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      <Card className="border-border bg-card/50">
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Author name (optional)</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Back-cover blurb (optional)</Label>
            <Input value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="One-line description" maxLength={400} />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel side="front" label="Front cover" />
        <Panel side="back" label="Back cover" />
      </div>
      <p className="text-center text-xs text-muted-foreground font-sans">
        Covers are generated by OpenAI’s image model per your art direction. Each generation counts toward your plan.
      </p>
    </div>
  );
};

export default CoverGenerator;
