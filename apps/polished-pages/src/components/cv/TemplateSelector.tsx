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

const FLAGSHIP_SCALE = 0.42;
const FLAGSHIP_W = Math.round(794 * FLAGSHIP_SCALE); // ~334

const TemplateSelector = ({ selected, onChange }: Props) => {
  const [showClassic, setShowClassic] = useState(false);
  const flagship = PREMIUM_TEMPLATES.find((t) => t.flagship);

  return (
    <div className="space-y-10">
      {/* ── Flagship hero ── */}
      {flagship && (
        <div className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-background p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <button type="button" onClick={() => onChange(flagship.id)} className="shrink-0 text-left">
              <div
                className={`relative overflow-hidden rounded-lg border bg-white shadow-sm transition ${selected === flagship.id ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/50"}`}
                style={{ width: FLAGSHIP_W, height: Math.round(FLAGSHIP_W * 1.414) }}
              >
                <div style={{ width: 794, transform: `scale(${FLAGSHIP_SCALE})`, transformOrigin: "top left", pointerEvents: "none" }}>
                  <PremiumCv data={MOCK_CV} template={flagship.id} />
                </div>
                {selected === flagship.id && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </button>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary font-sans">The Flagship</div>
              <h3 className="mt-1 font-serif text-2xl font-semibold">{flagship.name}</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground font-sans">{flagship.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Board-ready", "Consulting-ready", "Enterprise-ready", "ATS-safe", "Nordic-inspired"].map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground font-sans">{tag}</span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onChange(flagship.id)}
                className={`mt-4 rounded-md px-3.5 py-1.5 text-sm font-medium font-sans transition ${selected === flagship.id ? "bg-primary text-primary-foreground" : "border border-primary text-primary hover:bg-primary/10"}`}
              >
                {selected === flagship.id ? "Selected" : "Use this template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Career Collections ── */}
      {PREMIUM_COLLECTIONS.map((c) => {
        const items = PREMIUM_TEMPLATES.filter((t) => t.collection === c.id && !t.flagship);
        if (!items.length) return null;
        return (
          <div key={c.id}>
            <div className="mb-3 border-b border-border pb-2">
              <h3 className="font-serif text-lg font-semibold">{c.label} Collection</h3>
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
