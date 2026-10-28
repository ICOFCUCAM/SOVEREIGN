import { PanelRightClose, Sparkles } from "lucide-react";
import { InteriorTypeEditor } from "@/components/book/InteriorType";
import { TRIM_SIZES, getTrim } from "@/lib/print-sizes";

// Book page view (DESIGN-SPEC.md §21): the panel beside the page holds the page design at full size:
// the format and the interior (style, typefaces, size, line spacing, margins), the same settings
// Finish and every PDF export use. "Ask Claude" brings the Claude panel back.
export default function PageDesignPanel({ trimId, onTrim, onClaude, onClose }: {
  trimId?: string; onTrim: (id: string) => void; onClaude: () => void; onClose: () => void;
}) {
  const trim = getTrim(trimId || "6x9");
  return (
    <aside aria-label="Page design" className="flex h-full w-full flex-col bg-white dark:bg-[#11151C]">
      <div className="flex h-12 items-center gap-2 border-b border-[#E6E8ED] px-4 dark:border-white/10">
        <p className="text-[15px] font-semibold">Page design</p>
        <button type="button" onClick={onClaude} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-[#2563EB] hover:bg-muted"><Sparkles className="h-4 w-4" /> Ask Claude</button>
        <button type="button" onClick={onClose} aria-label="Close the panel" className="grid h-8 w-8 place-items-center rounded-md text-[#64748B] hover:bg-muted"><PanelRightClose className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 text-[15px]">
        <div className="space-y-1.5">
          <label htmlFor="pd-format" className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">Format</label>
          <select id="pd-format" value={trim.id} onChange={(e) => onTrim(e.target.value)} className="h-10 w-full rounded-[8px] border border-input bg-background px-2.5 text-[14.5px]">
            {TRIM_SIZES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
          <p className="text-[12.5px] text-[#64748B]">{Math.round(trim.wmm)} × {Math.round(trim.hmm)} mm. The cover and the print files use the same size.</p>
        </div>
        <InteriorTypeEditor large />
      </div>
    </aside>
  );
}
