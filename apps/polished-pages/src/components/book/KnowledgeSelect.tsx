import { useEffect, useState } from "react";
import { BrainCircuit, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { fetchPlanStatus } from "@/lib/session";
import { planAtLeast } from "@/lib/plans";
import { listKnowledgeBases, listKnowledgeDocs, type KnowledgeBase, type KnowledgeDoc } from "@/lib/knowledge";
import type { BookKnowledge } from "@/components/book/KnowledgePanel";

// The raw selection — the studio builds the final knowledge at generation time
// with a query, so reference documents are retrieved by vector search.
export interface KnowledgeSelection { rules: BookKnowledge | null; docIds: string[] }

// Compact picker to apply a saved Knowledge Base (rules/terminology/forbidden)
// and reference documents to a generation in the storybook / educational
// studios. Enterprise Plus only, shown only when the user has bases or docs.
const KnowledgeSelect = ({ onChange }: { onChange: (sel: KnowledgeSelection) => void }) => {
  const [allowed, setAllowed] = useState(false);
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [baseId, setBaseId] = useState("");
  const [docIds, setDocIds] = useState<string[]>([]);

  useEffect(() => {
    fetchPlanStatus().then((s) => {
      const ok = planAtLeast(s?.plan, "enterprise-plus");
      setAllowed(ok);
      if (ok) {
        listKnowledgeBases().then(setBases).catch(() => {});
        listKnowledgeDocs().then(setDocs).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const emit = (nextBaseId: string, nextDocIds: string[]) => {
    const b = bases.find((x) => x.id === nextBaseId);
    onChange({ rules: b ? { rules: b.rules, terminology: b.terminology, forbidden: b.forbidden } : null, docIds: nextDocIds });
  };

  if (!allowed || (bases.length === 0 && docs.length === 0)) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card/40 p-3">
      <Label className="flex items-center gap-1.5 font-sans text-xs font-semibold"><BrainCircuit className="h-3.5 w-3.5 text-primary" /> Knowledge base <span className="font-normal text-muted-foreground/60">(Enterprise Plus)</span></Label>
      {bases.length > 0 && (
        <select
          value={baseId}
          onChange={(e) => { setBaseId(e.target.value); emit(e.target.value, docIds); }}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans"
        >
          <option value="">No rules — default writing</option>
          {bases.map((b) => <option key={b.id} value={b.id}>{b.name}{b.org_name ? ` · ${b.org_name}` : ""}</option>)}
        </select>
      )}
      {docs.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground font-sans">Reference documents the AI must follow:</p>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {docs.map((d) => (
              <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm font-sans hover:bg-secondary/40">
                <input type="checkbox" checked={docIds.includes(d.id)} onChange={() => { const next = docIds.includes(d.id) ? docIds.filter((x) => x !== d.id) : [...docIds, d.id]; setDocIds(next); emit(baseId, next); }} className="h-3.5 w-3.5 accent-primary" />
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {(baseId || docIds.length > 0) && <p className="text-[11px] text-emerald-600 font-sans">Applied to this generation.</p>}
    </div>
  );
};

export default KnowledgeSelect;
