import React, { useState } from "react";
import { Button, Card, Kpi, SectionHeader } from "../lib/ui";
import { DILIGENCE } from "../lib/engines";

// Virtual Data Room — backed by the diligence engine output. Each
// diligence package becomes a folder in the room, with artifacts
// listed as the documents inside.

const CLASS_STYLE: Record<string, string> = {
  unclassified: "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  sensitive:    "bg-loi-500/15 text-loi-400 ring-loi-400/40",
  confidential: "bg-red-500/15 text-red-300 ring-red-400/40",
};

const DataRoom: React.FC = () => {
  const [activeKind, setActiveKind] = useState(DILIGENCE.documents[0]?.kind ?? "financial");
  const active = DILIGENCE.documents.find((d) => d.kind === activeKind) ?? DILIGENCE.documents[0];

  const totalArtifacts = DILIGENCE.documents.reduce((s, d) => s + d.artifacts.length, 0);
  const requiredArtifacts = DILIGENCE.documents.reduce((s, d) => s + d.artifacts.filter((a) => a.required).length, 0);
  const confidentialCount = DILIGENCE.documents.filter((d) => d.classification === "confidential").length;

  return (
    <div>
      <SectionHeader
        kicker="Module 02 · Workspace"
        title="Virtual Data Room"
        description="Diligence packages auto-generated from the company profile. Each artifact is watermarked and access-tracked once a buyer enters."
        actions={<><Button variant="ghost">New room</Button><Button>Upload</Button></>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Diligence packages" value={String(DILIGENCE.documents.length)} sub="financial · market · ux · tech · sec · legal · comm" />
        <Kpi label="Required artifacts" value={`${requiredArtifacts} / ${totalArtifacts}`} sub="upload before opening room" accent="#fbbf24" />
        <Kpi label="Confidential packages" value={String(confidentialCount)} sub="ring-1 access policy" accent="#f87171" />
        <Kpi label="Critical questions"  value={String(DILIGENCE.criticalQuestions.length)} sub="from the diligence engine" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {DILIGENCE.documents.map((doc) => (
            <button
              key={doc.kind}
              onClick={() => setActiveKind(doc.kind)}
              className={`block w-full rounded-lg border p-3 text-left transition ${
                activeKind === doc.kind
                  ? "border-deal-400/50 bg-deal-600/10"
                  : "border-white/10 bg-ink-800/40 hover:border-white/20 hover:bg-ink-800/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium leading-tight text-white">{doc.title}</div>
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${CLASS_STYLE[doc.classification]}`}>
                  {doc.classification}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-white/45">{doc.sections.length} sections · {doc.artifacts.length} artifacts</div>
            </button>
          ))}
        </div>

        {active && (
          <Card className="p-6">
            <div className="mb-5 border-b border-white/10 pb-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-deal-400">{active.kind.replace(/_/g, " ")}</div>
              <h2 className="mt-2 font-serif text-2xl font-bold text-white">{active.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span className={`rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wide ring-1 ${CLASS_STYLE[active.classification]}`}>
                  {active.classification}
                </span>
                <span className="text-white/45">{active.artifacts.length} artifact{active.artifacts.length === 1 ? "" : "s"}</span>
              </div>
            </div>

            <h3 className="mb-3 font-serif text-base font-bold text-white">Required artifacts</h3>
            <div className="space-y-2">
              {active.artifacts.map((a) => (
                <div key={a.filename} className="flex items-baseline justify-between rounded border border-white/10 bg-ink-900/40 px-3 py-2">
                  <div>
                    <div className="font-mono text-[12px] text-white">{a.filename}</div>
                    <div className="mt-0.5 text-[11px] text-white/50">{a.description}</div>
                  </div>
                  {a.required ? (
                    <span className="rounded bg-loi-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-loi-400">Required</span>
                  ) : (
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">Optional</span>
                  )}
                </div>
              ))}
            </div>

            <h3 className="mb-3 mt-6 font-serif text-base font-bold text-white">Sections & questions</h3>
            <div className="space-y-4">
              {active.sections.map((s, i) => (
                <div key={`${i}-${s.heading}`}>
                  <div className="font-medium text-white">{s.heading}</div>
                  <ul className="mt-2 space-y-1 text-[12px] text-white/65">
                    {s.questions.map((q) => (
                      <li key={q} className="flex items-baseline gap-2">
                        <span className="mt-1 inline-block h-1 w-1 rounded-full bg-deal-400" /> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DataRoom;
