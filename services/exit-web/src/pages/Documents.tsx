import React from "react";
import { Button, Card, Kpi, SectionHeader, timeAgo } from "../lib/ui";

interface Template { name: string; kind: "Term sheet" | "LOI" | "SPA" | "Disclosure" | "Side letter"; version: string; updatedAt: string; used: number }

const TEMPLATES: readonly Template[] = [
  { name: "Term Sheet — Strategic Acquisition",          kind: "Term sheet", version: "v3.1", updatedAt: new Date(Date.now() - 8  * 86400_000).toISOString(), used: 12 },
  { name: "Letter of Intent — Bilateral, Confidential",  kind: "LOI",        version: "v2.4", updatedAt: new Date(Date.now() - 14 * 86400_000).toISOString(), used: 9  },
  { name: "Share Purchase Agreement (Stock Sale)",       kind: "SPA",        version: "v5.0", updatedAt: new Date(Date.now() - 3  * 86400_000).toISOString(), used: 5  },
  { name: "Disclosure Schedule Index",                   kind: "Disclosure", version: "v1.2", updatedAt: new Date(Date.now() - 18 * 86400_000).toISOString(), used: 3  },
  { name: "Founder Side Letter — Retention & Earn-out",  kind: "Side letter", version: "v1.0", updatedAt: new Date(Date.now() - 26 * 86400_000).toISOString(), used: 2 },
];

const KIND_STYLE: Record<Template["kind"], string> = {
  "Term sheet": "text-deal-300",
  "LOI":        "text-loi-300",
  "SPA":        "text-stage-loi",
  "Disclosure": "text-white/65",
  "Side letter":"text-stage-engaged",
};

const Documents: React.FC = () => (
  <div>
    <SectionHeader
      kicker="Module 06 · Workspace"
      title="Document Generator"
      description="Term sheets, LOIs, SPAs, disclosure schedules and side letters from doctrine templates. Versioned, citation-tracked, signature-ready."
      actions={<><Button variant="ghost">Open library</Button><Button>Generate document</Button></>}
    />

    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Kpi label="Templates"          value={String(TEMPLATES.length)} sub="versioned · doctrine-aligned" />
      <Kpi label="Documents generated" value="31" sub="this exit" accent="#34d399" />
      <Kpi label="In counsel review"   value="2"  sub="Helios SPA · disclosure schedule" accent="#fbbf24" />
      <Kpi label="Signature-ready"     value="1"  sub="Sentinel side letter" />
    </div>

    <div className="mt-10">
      <h2 className="mb-3 font-serif text-lg font-bold">Template library</h2>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3">Template</th>
              <th className="px-5 py-3">Kind</th>
              <th className="px-5 py-3">Version</th>
              <th className="px-5 py-3 text-right">Used</th>
              <th className="px-5 py-3">Updated</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {TEMPLATES.map((t) => (
              <tr key={t.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3.5 font-medium text-white">{t.name}</td>
                <td className={`px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wide ${KIND_STYLE[t.kind]}`}>{t.kind}</td>
                <td className="px-5 py-3.5 font-mono text-[12px] text-white/70">{t.version}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{t.used}</td>
                <td className="px-5 py-3.5 text-xs text-white/45">{timeAgo(t.updatedAt)}</td>
                <td className="px-5 py-3.5"><button className="text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300">Use &rarr;</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  </div>
);

export default Documents;
