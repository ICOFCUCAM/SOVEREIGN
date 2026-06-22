import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Crown, Check, Ban, BookText, Tags } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchPlanStatus, type PlanStatus } from "@/lib/session";
import { planAtLeast, planDisplayName } from "@/lib/plans";

export interface BookKnowledge { rules: string; terminology: string; forbidden: string }
export const emptyKnowledge = (): BookKnowledge => ({ rules: "", terminology: "", forbidden: "" });
export const hasKnowledge = (k?: BookKnowledge): boolean => !!k && !!(k.rules.trim() || k.terminology.trim() || k.forbidden.trim());

// Knowledge Base & Author Memory — an Enterprise Plus capability. The author
// instructs the AI how to write this project (rules + approved terminology) and
// sets hard constraints (forbidden terms/concepts). These are injected into
// every generation in the project and persist with it, so chapter 20 respects
// the same doctrine, terminology and style as chapter 1. (Document upload +
// retrieval is a separate, heavier capability.)
const KnowledgePanel = ({ knowledge, setKnowledge }: { knowledge: BookKnowledge; setKnowledge: (k: BookKnowledge) => void }) => {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  useEffect(() => { fetchPlanStatus().then(setStatus); }, []);
  const allowed = planAtLeast(status?.plan, "enterprise-plus");
  const set = (k: keyof BookKnowledge) => (e: React.ChangeEvent<HTMLTextAreaElement>) => setKnowledge({ ...knowledge, [k]: e.target.value });

  if (status && !allowed) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-gold" /><h3 className="font-serif text-lg font-bold">Knowledge Base is an Enterprise Plus feature</h3></div>
          <p className="mt-2 text-sm text-muted-foreground font-sans">Teach the AI your project’s rules — required terminology, house style, and content it must never use — and have it obey them across every chapter, edition and educational resource. Available on Enterprise Plus{status?.plan ? ` (you're on ${planDisplayName(status.plan)})` : ""}.</p>
          <ul className="mt-3 space-y-1.5">
            {["Writing rules & house style applied to every generation", "Approved terminology (e.g. always “Yahusha”, never “Jesus”)", "Forbidden terms & concepts as hard constraints", "Persists across sessions; shareable across an institution"].map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm font-sans"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p}</li>
            ))}
          </ul>
          <Button asChild variant="hero" className="mt-4"><Link to="/pricing"><Crown className="mr-2 h-4 w-4" /> Talk to us about Enterprise Plus</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardContent className="space-y-2 p-5">
          <Label className="flex items-center gap-2 font-sans text-sm font-semibold"><BookText className="h-4 w-4 text-primary" /> Writing rules</Label>
          <p className="text-[11px] text-muted-foreground font-sans">How the AI should write this whole project — tone, perspective, audience, theological/editorial positions, structure. One instruction per line.</p>
          <Textarea value={knowledge.rules} onChange={set("rules")} rows={5} maxLength={6000} placeholder={"Formal academic tone.\nAlways cite Scripture for claims.\nTarget age 12–16.\nFollow our house style guide."} className="resize-none font-sans text-sm" />
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="space-y-2 p-5">
          <Label className="flex items-center gap-2 font-sans text-sm font-semibold"><Tags className="h-4 w-4 text-primary" /> Approved terminology</Label>
          <p className="text-[11px] text-muted-foreground font-sans">Preferred terms the AI must use. Write “use X instead of Y”, one per line.</p>
          <Textarea value={knowledge.terminology} onChange={set("terminology")} rows={4} maxLength={4000} placeholder={"Use “Yahusha”, not “Jesus”.\nUse “Yahudim”, not “Jews”.\nUse “assembly”, not “church”."} className="resize-none font-sans text-sm" />
        </CardContent>
      </Card>
      <Card className="border-destructive/30 bg-destructive/[0.03]">
        <CardContent className="space-y-2 p-5">
          <Label className="flex items-center gap-2 font-sans text-sm font-semibold"><Ban className="h-4 w-4 text-destructive" /> Forbidden terms &amp; concepts</Label>
          <p className="text-[11px] text-muted-foreground font-sans">Hard constraints — the AI must never use these names, terms or concepts. One per line.</p>
          <Textarea value={knowledge.forbidden} onChange={set("forbidden")} rows={4} maxLength={4000} placeholder={"Jesus Christ\nTrinity\nSunday worship\nPolitical opinions"} className="resize-none font-sans text-sm" />
        </CardContent>
      </Card>
      <p className="text-[11px] text-muted-foreground font-sans">{hasKnowledge(knowledge) ? "Applied to outline and chapter generation in this project. Saved with the book — it persists across sessions." : "Add rules above and they’ll guide every generation in this book."}</p>
    </div>
  );
};

export default KnowledgePanel;
