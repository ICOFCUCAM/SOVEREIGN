import { useEffect, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { Label } from "@/components/ui/label";
import { fetchPlanStatus } from "@/lib/session";
import { planAtLeast } from "@/lib/plans";
import { listKnowledgeBases, type KnowledgeBase } from "@/lib/knowledge";
import type { BookKnowledge } from "@/components/book/KnowledgePanel";

// Compact picker to apply a saved Knowledge Base (rules/terminology/forbidden)
// to a generation in the storybook / educational studios. Enterprise Plus only,
// and only shown when the user actually has bases — otherwise it renders nothing.
const KnowledgeSelect = ({ onChange }: { onChange: (k: BookKnowledge | null) => void }) => {
  const [allowed, setAllowed] = useState(false);
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [id, setId] = useState("");

  useEffect(() => {
    fetchPlanStatus().then((s) => {
      const ok = planAtLeast(s?.plan, "enterprise-plus");
      setAllowed(ok);
      if (ok) listKnowledgeBases().then(setBases).catch(() => {});
    }).catch(() => {});
  }, []);

  if (!allowed || bases.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 font-sans text-xs"><BrainCircuit className="h-3.5 w-3.5 text-primary" /> Knowledge base <span className="text-muted-foreground/60">(Enterprise Plus)</span></Label>
      <select
        value={id}
        onChange={(e) => {
          const v = e.target.value; setId(v);
          const b = bases.find((x) => x.id === v);
          onChange(b ? { rules: b.rules, terminology: b.terminology, forbidden: b.forbidden } : null);
        }}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans"
      >
        <option value="">None — default writing</option>
        {bases.map((b) => <option key={b.id} value={b.id}>{b.name}{b.org_name ? ` · ${b.org_name}` : ""}</option>)}
      </select>
      {id && <p className="text-[11px] text-muted-foreground font-sans">Applied: required terminology and forbidden content will be enforced in this generation.</p>}
    </div>
  );
};

export default KnowledgeSelect;
