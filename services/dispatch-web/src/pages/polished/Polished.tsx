import React from "react";
import { Button, Card } from "../../lib/ui";

// Polished Pages is its own standalone product (light theme). Rather than fork
// its UI into the console, this department is a doorway: one Polished Pages, one
// place to maintain it, so any upgrade — engine or interface — is reflected here
// automatically. The launch target is the deployed standalone address.
const STANDALONE_URL = import.meta.env.VITE_POLISHED_PAGES_URL ?? "";

const DOCS: { title: string; blurb: string; icon: string }[] = [
  { title: "CV / Résumé", blurb: "ATS-ready CVs across 40+ templates.", icon: "📄" },
  { title: "Cover Letter", blurb: "Tailored to a specific job description.", icon: "✉️" },
  { title: "Book", blurb: "Outline, then write it chapter by chapter.", icon: "📚" },
];

const Polished: React.FC = () => (
  <div>
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-white">Polished Pages</h1>
      <p className="text-sm text-white/50">
        Your personal-document studio — CVs, cover letters, and books. It runs as its own product; open it to author with the full studio.
      </p>
    </header>

    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {DOCS.map((d) => (
        <Card key={d.title} className="p-5">
          <div className="text-2xl">{d.icon}</div>
          <div className="mt-3 text-base font-bold text-white">{d.title}</div>
          <div className="mt-1 text-[13px] leading-snug text-white/50">{d.blurb}</div>
        </Card>
      ))}
    </div>

    {STANDALONE_URL ? (
      <a href={STANDALONE_URL} target="_blank" rel="noopener noreferrer">
        <Button>Open Polished Pages ↗</Button>
      </a>
    ) : (
      <Card className="p-4">
        <p className="text-sm text-white/60">
          The Polished Pages studio address isn’t configured yet. Set{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-white/80">VITE_POLISHED_PAGES_URL</code>{" "}
          to its deployed URL to enable the launch button.
        </p>
      </Card>
    )}
  </div>
);

export default Polished;
