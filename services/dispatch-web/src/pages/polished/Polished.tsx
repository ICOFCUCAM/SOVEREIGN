import React from "react";
import { Link } from "react-router-dom";
import { Alert, Badge, PageHeader, Panel } from "../../components/console/ds";
import { Icon } from "../../components/console/icons";

// Polished Pages is its own standalone product (light theme). Rather than fork
// its UI into the console, this department is a doorway: one Polished Pages, one
// place to maintain it, so any upgrade — engine or interface — is reflected here
// automatically. The launch target is the deployed standalone address. This page
// reports only whether the address is configured — it cannot and does not claim
// the external studio is reachable.
const STANDALONE_URL = import.meta.env.VITE_POLISHED_PAGES_URL ?? "";

const DOCS: { title: string; blurb: string }[] = [
  { title: "CV / Résumé", blurb: "ATS-ready CVs across 40+ templates." },
  { title: "Cover Letter", blurb: "Tailored to a specific job description." },
  { title: "Book", blurb: "Outline, then write it chapter by chapter." },
];

const Polished: React.FC = () => (
  <div>
    <PageHeader
      eyebrow="Document studio"
      title="Polished Pages"
      description="Your personal-document studio — CVs, cover letters, and books. It runs as its own product, outside the governed record pipeline; open it to author with the full studio."
      meta={<span>Separate product · integration</span>}
      actions={STANDALONE_URL ? (
        <a href={STANDALONE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg bg-sd-accentbg px-3.5 text-[13px] font-semibold text-sd-accentink hover:bg-white">
          Open Polished Pages <Icon.external className="h-3.5 w-3.5" /><span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : undefined}
    />

    <Alert tone="info" className="mb-5" title="Not part of the official record">
      Documents authored in Polished Pages are not governed, approved, certified or preserved by Sovereign Dispatch. To produce an official record, use <Link to="/console/create" className="font-semibold text-sd-accent hover:underline">Create official record</Link>.
    </Alert>

    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {DOCS.map((d) => (
        <Panel key={d.title}>
          <Icon.studio className="h-5 w-5 text-sd-text3" />
          <div className="mt-3 text-[14px] font-semibold text-sd-text">{d.title}</div>
          <div className="mt-1 text-[12.5px] leading-snug text-sd-text3">{d.blurb}</div>
        </Panel>
      ))}
    </div>

    <Panel headingLevel={2} title="Studio connection" aside={STANDALONE_URL ? <Badge tone="info" glyph="●">Address configured</Badge> : <Badge tone="warn" glyph="○">Not configured</Badge>}>
      {STANDALONE_URL ? (
        <p className="text-[13px] text-sd-text2">The studio opens at <code className="rounded bg-sd-sunken px-1.5 py-0.5 text-[12px] text-sd-text">{STANDALONE_URL}</code> in a new tab. Its availability is not checked from here.</p>
      ) : (
        <p className="text-[13px] text-sd-text2">
          The Polished Pages studio address isn’t configured yet. Set{" "}
          <code className="rounded bg-sd-sunken px-1.5 py-0.5 text-[12px] text-sd-text">VITE_POLISHED_PAGES_URL</code>{" "}
          to its deployed URL to enable the launch button.
        </p>
      )}
    </Panel>
  </div>
);

export default Polished;
