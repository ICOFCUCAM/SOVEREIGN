import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../lib/ui";

// Polished Pages department index. Polished Pages also ships as a standalone
// product; this is the same engine surfaced as a department inside the Dispatch
// console, alongside the institutional-document authoring in "Create".
const DOCS: { to: string; title: string; blurb: string; icon: string }[] = [
  { to: "/console/polished/cv", title: "CV / Résumé", blurb: "Generate an ATS-ready CV from structured details across 40+ templates.", icon: "📄" },
  { to: "/console/polished/cover-letter", title: "Cover Letter", blurb: "A tailored cover letter matched to a specific job description.", icon: "✉️" },
  { to: "/console/polished/book", title: "Book", blurb: "Build a book from a generated outline, chapter by chapter.", icon: "📚" },
];

const Polished: React.FC = () => {
  const nav = useNavigate();
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Polished Pages</h1>
        <p className="text-sm text-white/50">
          Personal-document generation — CVs, cover letters, and books. Same engine as the standalone Polished Pages product, here as a department in the console.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {DOCS.map((d) => (
          <button key={d.to} onClick={() => nav(d.to)} className="text-left">
            <Card className="h-full p-5 transition hover:border-seal-light/50">
              <div className="text-2xl">{d.icon}</div>
              <div className="mt-3 text-base font-bold text-white">{d.title}</div>
              <div className="mt-1 text-[13px] leading-snug text-white/50">{d.blurb}</div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Polished;
