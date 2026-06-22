import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Crown, Check, Ban, BookText, Tags, Loader2, FolderInput, Save, Trash2, FileText, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fetchPlanStatus, type PlanStatus } from "@/lib/session";
import { planAtLeast, planDisplayName } from "@/lib/plans";
import { listKnowledgeBases, saveKnowledgeBase, deleteKnowledgeBase, listKnowledgeDocs, saveKnowledgeDoc, deleteKnowledgeDoc, type KnowledgeBase, type KnowledgeDoc } from "@/lib/knowledge";
import { extractFileText } from "@/lib/extract-file-text";
import { myOrganizations, can, type OrgSummary } from "@/lib/organizations";

export interface BookKnowledge { rules: string; terminology: string; forbidden: string }
export const emptyKnowledge = (): BookKnowledge => ({ rules: "", terminology: "", forbidden: "" });
export const hasKnowledge = (k?: BookKnowledge): boolean => !!k && !!(k.rules.trim() || k.terminology.trim() || k.forbidden.trim());

// Knowledge Base & Author Memory — an Enterprise Plus capability. The author
// instructs the AI how to write this project (rules + approved terminology) and
// sets hard constraints (forbidden terms/concepts). These are injected into
// every generation in the project and persist with it, so chapter 20 respects
// the same doctrine, terminology and style as chapter 1. (Document upload +
// retrieval is a separate, heavier capability.)
const KnowledgePanel = ({ knowledge, setKnowledge, activeDocIds = [], onActiveDocsChange }: { knowledge: BookKnowledge; setKnowledge: (k: BookKnowledge) => void; activeDocIds?: string[]; onActiveDocsChange?: (ids: string[]) => void }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadId, setLoadId] = useState("");
  const [saveName, setSaveName] = useState("");
  const [saveOrg, setSaveOrg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetchPlanStatus().then(setStatus); }, []);
  const allowed = planAtLeast(status?.plan, "enterprise-plus");
  useEffect(() => {
    if (!allowed) return;
    listKnowledgeBases().then(setBases).catch(() => {});
    listKnowledgeDocs().then(setDocs).catch(() => {});
    myOrganizations().then((l) => setOrgs(l.filter((o) => can.edit(o.role)))).catch(() => {});
  }, [allowed]);

  const uploadDocs = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files)) {
        try {
          const text = await extractFileText(file);
          if (!text.trim()) { toast({ title: `No text found in ${file.name}`, variant: "destructive" }); continue; }
          const id = await saveKnowledgeDoc({ name: file.name, content: text });
          added.push(id);
        } catch (e) {
          toast({ title: `Could not add ${file.name}`, description: e instanceof Error ? e.message : "", variant: "destructive" });
        }
      }
      if (added.length) {
        setDocs(await listKnowledgeDocs());
        onActiveDocsChange?.([...activeDocIds, ...added]); // newly uploaded are active by default
        toast({ title: `${added.length} document${added.length === 1 ? "" : "s"} added` });
      }
    } finally { setUploading(false); }
  };
  const toggleDoc = (id: string) => onActiveDocsChange?.(activeDocIds.includes(id) ? activeDocIds.filter((x) => x !== id) : [...activeDocIds, id]);
  const removeDoc = async (id: string) => {
    try { await deleteKnowledgeDoc(id); setDocs(await listKnowledgeDocs()); onActiveDocsChange?.(activeDocIds.filter((x) => x !== id)); }
    catch (e) { toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };
  const set = (k: keyof BookKnowledge) => (e: React.ChangeEvent<HTMLTextAreaElement>) => setKnowledge({ ...knowledge, [k]: e.target.value });

  const loadBase = () => {
    const b = bases.find((x) => x.id === loadId);
    if (!b) return;
    setKnowledge({ rules: b.rules, terminology: b.terminology, forbidden: b.forbidden });
    toast({ title: "Loaded", description: `“${b.name}” applied to this book.` });
  };
  const saveBase = async () => {
    if (!saveName.trim()) { toast({ title: "Name your knowledge base first" }); return; }
    setBusy(true);
    try {
      await saveKnowledgeBase({ name: saveName.trim(), rules: knowledge.rules, terminology: knowledge.terminology, forbidden: knowledge.forbidden, orgId: saveOrg || null });
      setBases(await listKnowledgeBases());
      setSaveName("");
      toast({ title: "Knowledge base saved", description: saveOrg ? "Shared with your organization." : "Saved to your library — reuse it on any book." });
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(false); }
  };
  const removeBase = async () => {
    const b = bases.find((x) => x.id === loadId);
    if (!b) return;
    try { await deleteKnowledgeBase(b.id); setBases(await listKnowledgeBases()); setLoadId(""); toast({ title: "Deleted" }); }
    catch (e) { toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

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
      {/* Reusable, optionally org-shared knowledge bases. */}
      <Card className="border-border bg-card/50">
        <CardContent className="space-y-3 p-5">
          <Label className="flex items-center gap-2 font-sans text-sm font-semibold"><FolderInput className="h-4 w-4 text-primary" /> Reusable knowledge bases</Label>
          <p className="text-[11px] text-muted-foreground font-sans">Define rules once and reuse them across books — and share them with your institution so every author inherits the same standards.</p>
          {bases.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <select value={loadId} onChange={(e) => setLoadId(e.target.value)} className="min-w-[200px] flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                <option value="">Choose a saved base…</option>
                {bases.map((b) => <option key={b.id} value={b.id}>{b.name}{b.org_name ? ` · ${b.org_name}` : ""}</option>)}
              </select>
              <Button variant="heroOutline" size="sm" disabled={!loadId} onClick={loadBase}>Load into this book</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" disabled={!loadId} onClick={removeBase} title="Delete this base"><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Name (e.g. Yahusha Series house rules)" maxLength={80} className="min-w-[200px] flex-1 text-sm" />
            {orgs.length > 0 && (
              <select value={saveOrg} onChange={(e) => setSaveOrg(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-sans" title="Share with an organization">
                <option value="">Personal</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
            <Button variant="hero" size="sm" disabled={busy} onClick={saveBase}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />} Save current as base
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reference documents — the AI writes in line with these sources. */}
      <Card className="border-border">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="flex items-center gap-2 font-sans text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Reference documents</Label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium font-sans hover:border-primary/40">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
              <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.markdown" className="hidden" disabled={uploading} onChange={(e) => { uploadDocs(e.target.files); e.target.value = ""; }} />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground font-sans">Upload doctrine, a terminology guide, research or previous books (PDF, DOCX, TXT, MD). Checked documents are used as source material the AI must stay consistent with when writing this book.</p>
          {docs.length > 0 ? (
            <div className="space-y-1.5">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-2.5 py-1.5">
                  <input type="checkbox" checked={activeDocIds.includes(d.id)} onChange={() => toggleDoc(d.id)} className="h-3.5 w-3.5 accent-primary" />
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-sans">{d.name}{d.org_name ? <span className="text-muted-foreground"> · {d.org_name}</span> : ""}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground font-sans">{Math.round(d.chars / 1000)}k</span>
                  <button onClick={() => removeDoc(d.id)} className="shrink-0 text-muted-foreground/60 hover:text-destructive" title="Delete document"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-sans">No documents yet. Upload reference material the AI should follow.</p>
          )}
        </CardContent>
      </Card>

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
