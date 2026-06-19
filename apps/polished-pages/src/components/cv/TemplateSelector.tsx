import { useState } from "react";
import { Check } from "lucide-react";
import { CVTemplate, CV_TEMPLATES, CV_TEMPLATE_CATEGORIES } from "@/types/cv";
import { PREMIUM_TEMPLATES, PREMIUM_COLLECTIONS } from "@/lib/premium-templates";
import { MOCK_CV } from "@/lib/cv-mock";
import PremiumCv from "@/components/PremiumCv";

interface Props {
  selected: CVTemplate;
  onChange: (template: CVTemplate) => void;
}

const SCALE = 0.224;
const W = Math.round(794 * SCALE); // ~178

const PreviewCard = ({ id, name, blurb, selected, onChange }: { id: string; name: string; blurb: string; selected: boolean; onChange: (t: string) => void }) => (
  <button type="button" onClick={() => onChange(id)} className="text-left">
    <div
      className={`relative overflow-hidden rounded-lg border bg-white transition ${selected ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/50"}`}
      style={{ width: W, height: 252 }}
    >
      <div style={{ width: 794, transform: `scale(${SCALE})`, transformOrigin: "top left", pointerEvents: "none" }}>
        <PremiumCv data={MOCK_CV} template={id} />
      </div>
      {selected && (
        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </div>
      )}
    </div>
    <div className="mt-1.5 text-sm font-medium font-sans">{name}</div>
    <div className="text-xs text-muted-foreground font-sans">{blurb}</div>
  </button>
);

const TemplateSelector = ({ selected, onChange }: Props) => {
  const [showClassic, setShowClassic] = useState(false);

  return (
    <div className="space-y-8">
      {PREMIUM_COLLECTIONS.map((c) => {
        const items = PREMIUM_TEMPLATES.filter((t) => t.collection === c.id);
        if (!items.length) return null;
        return (
          <div key={c.id}>
            <div className="mb-3">
              <h3 className="font-serif text-lg font-semibold">{c.label}</h3>
              <p className="text-xs text-muted-foreground font-sans">{c.blurb}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {items.map((t) => (
                <PreviewCard key={t.id} id={t.id} name={t.name} blurb={t.blurb} selected={selected === t.id} onChange={onChange} />
              ))}
            </div>
          </div>
        );
      })}

      <div className="border-t border-border pt-4">
        <button type="button" onClick={() => setShowClassic((s) => !s)} className="text-sm text-muted-foreground underline underline-offset-2 font-sans">
          {showClassic ? "Hide" : "Show"} classic templates (legacy)
        </button>
        {showClassic && (
          <div className="mt-4 space-y-4">
            {CV_TEMPLATE_CATEGORIES.filter((cat) => cat.id !== "premium").map((cat) => {
              const items = CV_TEMPLATES.filter((t) => t.category === cat.id);
              if (!items.length) return null;
              return (
                <div key={cat.id}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onChange(t.id)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-sans ${selected === t.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
