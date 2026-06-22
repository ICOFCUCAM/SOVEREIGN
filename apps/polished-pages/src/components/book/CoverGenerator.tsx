import { useEffect, useState } from "react";
import { ImageIcon, Loader2, Download, Sparkles, Crown, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authHeader, fetchPlanStatus, startUpgrade, type PlanStatus } from "@/lib/session";
import { translateLocalize } from "@/lib/translate";
import { recordBatchOp } from "@/lib/editions";
import { LANGUAGE_NAMES } from "@/lib/languages";
import SaveToLibrary from "@/components/app/SaveToLibrary";

type Side = "front" | "back";

const STYLE_PRESETS: { label: string; text: string }[] = [
  { label: "Minimalist", text: "Clean minimalist design with ample white space, bold typography, single focal image." },
  { label: "Illustrated", text: "Hand-drawn illustration style, warm palette, rich detail reminiscent of classic children's picture books." },
  { label: "Photographic", text: "Photorealistic composition, cinematic lighting, depth of field, editorial quality." },
  { label: "Abstract", text: "Abstract geometric shapes, bold primary colours, modern graphic design aesthetic." },
  { label: "Dark & Moody", text: "Dark dramatic background, high contrast, atmospheric mist or shadow, thriller or literary fiction tone." },
  { label: "Watercolour", text: "Soft watercolour wash, pastel tones, gentle brushwork, dreamy and ethereal feel." },
];

const PRO_PERKS = [
  "AI-designed front and back covers",
  "Unlimited regenerations and art-direction tweaks",
  "Print-ready portrait covers you can download",
];

// AI cover + back-cover design via OpenAI gpt-image-1 (the platform's image
// engine; Claude has no image model). The author fills in the title and art
// direction before generating. Cover design is a Pro-plan capability.
const CoverGenerator = ({ title: initialTitle, subtitle: initialSubtitle, isbn, publisher, onGenerated }: { title?: string; subtitle?: string; isbn?: string; publisher?: string; onGenerated?: () => void }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [subtitle, setSubtitle] = useState(initialSubtitle ?? "");
  const [author, setAuthor] = useState("");
  const [blurb, setBlurb] = useState("");
  const [instr, setInstr] = useState<Record<Side, string>>({ front: "", back: "" });
  const [img, setImg] = useState<Record<Side, string | null>>({ front: null, back: null });
  const [busy, setBusy] = useState<Side | null>(null);
  const [coverLangs, setCoverLangs] = useState<string[]>([]);
  const [batch, setBatch] = useState<{ label: string; done: number; total: number } | null>(null);
  const [batchImg, setBatchImg] = useState<Record<string, string>>({});

  useEffect(() => { fetchPlanStatus().then(setStatus); }, []);
  const isPro = !!status?.plan && status.plan !== "free"; // any paid tier

  const coverFetch = async (body: Record<string, unknown>) => {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-book-cover`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: await authHeader() }, body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Cover generation failed"); }
    return (await res.json()).image as string;
  };

  const generateBatch = async () => {
    setBatch({ label: "Starting", done: 0, total: coverLangs.length });
    const out: Record<string, string> = { ...batchImg };
    try {
      for (let i = 0; i < coverLangs.length; i++) {
        const lang = coverLangs[i];
        setBatch({ label: lang, done: i, total: coverLangs.length });
        let tTitle = title;
        if (title.trim()) { try { tTitle = (await translateLocalize({ content: title, targetLanguage: lang, mode: "translate" })).replace(/^#+\s*/, "").trim(); } catch { /* keep original */ } }
        out[lang] = await coverFetch({ side: "front", instruction: instr.front, title: tTitle, subtitle, author, blurb, isbn, publisher });
        setBatchImg({ ...out });
        setBatch({ label: lang, done: i + 1, total: coverLangs.length });
      }
      recordBatchOp(coverLangs.length); // telemetry: one unit per language cover
    } catch (e) {
      toast({ title: "Batch covers failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBatch(null);
    }
  };

  const generate = async (side: Side) => {
    if (!title.trim() && !instr[side].trim()) {
      toast({ title: "Add a title or art direction", description: "Tell the model what to design.", variant: "destructive" });
      return;
    }
    setBusy(side);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-book-cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ side, instruction: instr[side], title, subtitle, author, blurb, isbn, publisher }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Cover generation failed");
      }
      const data = await res.json();
      setImg((p) => ({ ...p, [side]: data.image as string }));
      onGenerated?.();
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

  // Gate: cover design is a Pro-plan capability.
  if (status && !isPro) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg"><Crown className="h-5 w-5 text-gold" /> Cover design is a Pro feature</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-sans">Generate bookstore-quality front and back covers with AI, guided by your own title and art direction.</p>
          <ul className="mt-3 space-y-1.5">
            {PRO_PERKS.map((p) => <li key={p} className="flex items-start gap-2 text-sm font-sans"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p}</li>)}
          </ul>
          <Button variant="hero" className="mt-4" onClick={() => startUpgrade().catch(() => {})}>
            <Crown className="mr-2 h-4 w-4" /> Upgrade to Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

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
            <img src={img[side]!} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          )}
        </div>
        {side === "front" && (
          <div className="flex flex-wrap gap-1">
            {STYLE_PRESETS.map((p) => (
              <button key={p.label} type="button"
                onClick={() => setInstr((prev) => ({ ...prev, front: prev.front ? `${prev.front} ${p.text}` : p.text }))}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] font-sans text-muted-foreground hover:border-primary/40 hover:text-primary transition">
                {p.label}
              </button>
            ))}
          </div>
        )}
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
      {/* Title + metadata the author controls before generation */}
      <Card className="border-border bg-card/50">
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Title (shown on the cover)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Subtitle (optional)</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" maxLength={160} />
          </div>
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
      {(img.front || img.back) && (
        <div className="flex justify-center">
          <SaveToLibrary
            kind="cover"
            title={`${title || "Book"} — cover`}
            payload={{ front: img.front, back: img.back, title, subtitle, author }}
            preview="AI-designed book cover"
          />
        </div>
      )}
      {/* Multi-language covers: one front cover per language with the title translated. */}
      <Card className="border-border">
        <CardHeader className="pb-3"><CardTitle className="font-serif text-base">Covers in other languages</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground font-sans">Generate a front cover per language — the title is translated and the front art direction reused.</p>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_NAMES.map((l) => {
              const on = coverLangs.includes(l);
              return <button key={l} type="button" onClick={() => setCoverLangs((c) => on ? c.filter((x) => x !== l) : [...c, l])} className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>;
            })}
          </div>
          <Button variant="hero" size="sm" disabled={!!batch || coverLangs.length === 0} onClick={generateBatch}>
            {batch ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            {batch ? `${batch.label} ${batch.done}/${batch.total}` : `Generate ${coverLangs.length || ""} cover${coverLangs.length === 1 ? "" : "s"}`}
          </Button>
          {Object.keys(batchImg).length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(batchImg).map(([lang, src]) => (
                <div key={lang}>
                  <div className="overflow-hidden rounded-lg border border-border"><img src={src} alt={lang} className="aspect-[2/3] w-full object-cover" /></div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-sans">{lang}</span>
                    <button type="button" onClick={() => { const a = document.createElement("a"); a.href = src; a.download = `cover-${lang}.png`; a.click(); }} className="text-xs text-primary hover:underline"><Download className="inline h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground font-sans">
        Covers are generated by OpenAI’s image model from your title and art direction. Each generation counts toward your plan.
      </p>
    </div>
  );
};

export default CoverGenerator;
