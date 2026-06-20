import { useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Sparkles, Loader2, Download, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateIllustration } from "@/lib/storybook";
import { uploadDataUrl } from "@/lib/media-upload";
import { saveDocument } from "@/lib/documents";

type Orient = "square" | "portrait" | "landscape";
const STYLES = [
  { id: "picture", label: "Picture", art: "Soft, warm children's picture-book illustration, gentle colour palette.", lineArt: false },
  { id: "diagram", label: "Diagram", art: "Clean, clearly-labelled educational diagram, flat vector style, simple colours, school textbook quality.", lineArt: false },
  { id: "science", label: "Science", art: "Accurate science illustration, clear and educational, labelled, clean background.", lineArt: false },
  { id: "history", label: "Historical scene", art: "Tasteful, age-appropriate historical scene illustration, warm and educational.", lineArt: false },
  { id: "geography", label: "Geography", art: "Clear geography visual — map-like or landscape, educational, clean and bright.", lineArt: false },
  { id: "poster", label: "Classroom poster", art: "Bold, bright classroom poster, friendly and motivating, simple shapes.", lineArt: false },
  { id: "lineart", label: "Line art", art: "", lineArt: true },
] as const;

const IllustrationStudio = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [styleId, setStyleId] = useState<string>("diagram");
  const [orient, setOrient] = useState<Orient>("landscape");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const style = STYLES.find((s) => s.id === styleId) ?? STYLES[0];

  const generate = async () => {
    if (prompt.trim().length < 4) return;
    setBusy(true);
    setSaveState("idle");
    try {
      const img = await generateIllustration({ prompt, artStyle: style.art || undefined, orientation: orient, lineArt: style.lineArt });
      setImage(img);
    } catch (e) {
      toast({ title: "Generation failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image; a.download = "illustration.png"; a.click();
  };

  const save = async () => {
    if (!image) return;
    setSaveState("saving");
    try {
      const url = await uploadDataUrl(image, `illustration-${(crypto.randomUUID?.() ?? Date.now().toString(36))}`, "image");
      const title = prompt.slice(0, 60) || "Illustration";
      await saveDocument({ kind: "illustration", title, payload: { image: url, prompt, style: style.label }, preview: style.label });
      setSaveState("saved");
      toast({ title: "Saved to library", description: "Find it any time under Library." });
    } catch (e) {
      setSaveState("idle");
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
        <Link to="/children" className="text-xs text-muted-foreground hover:text-foreground font-sans">← Children’s Publishing Studio</Link>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
          <ImagePlus className="w-4 h-4 text-gold" />
          <span className="text-sm text-gold-light font-medium font-sans">Illustration Studio</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">Educational <span className="text-gradient-gold italic">illustrations</span></h1>
        <p className="text-muted-foreground font-sans mb-8">Generate diagrams, science and geography visuals, historical scenes, classroom posters and line art — and save them to your Library to reuse in books and lessons.</p>

        <Card className="border-border bg-card/50">
          <CardHeader><CardTitle className="font-serif text-lg">Describe the illustration</CardTitle><CardDescription className="font-sans">Be specific — subject, what to show, any labels.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} maxLength={1000} placeholder="e.g. The water cycle: evaporation, clouds, rain and rivers, with labels" className="resize-none" />
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Style</Label>
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map((s) => (
                  <button key={s.id} type="button" onClick={() => setStyleId(s.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${styleId === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{s.label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Orientation</Label>
              <div className="flex gap-1.5">
                {(["landscape", "square", "portrait"] as Orient[]).map((o) => (
                  <button key={o} type="button" onClick={() => setOrient(o)}
                    className={`rounded-full border px-3 py-1 text-xs font-sans capitalize transition ${orient === o ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{o}</button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="hero" size="lg" className="mt-6 w-full py-6" onClick={generate} disabled={busy || prompt.trim().length < 4}>
          {busy ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="w-5 h-5 mr-2" /> Generate illustration</>}
        </Button>

        {image && (
          <div className="mt-6">
            <div className="overflow-hidden rounded-xl border border-border shadow-premium bg-white">
              <img src={image} alt="Illustration" className="w-full" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="heroOutline" size="sm" onClick={download}><Download className="w-4 h-4 mr-1" /> PNG</Button>
              <Button variant="heroOutline" size="sm" disabled={saveState !== "idle"} onClick={save}>
                {saveState === "saving" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : saveState === "saved" ? <Check className="w-4 h-4 mr-1 text-green-600" /> : <Save className="w-4 h-4 mr-1" />}
                {saveState === "saved" ? "Saved" : "Save to library"}
              </Button>
            </div>
          </div>
        )}
        <p className="mt-3 text-center text-xs text-muted-foreground font-sans">Illustrations are generated by OpenAI’s image model. Each generation counts toward your plan.</p>
      </div>
    </div>
  );
};

export default IllustrationStudio;
