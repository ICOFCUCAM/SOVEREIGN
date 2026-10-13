import React, { useState } from "react";
import { Empty, PageHeader, Provenance } from "./xo";

// For a founder with a saved intake, a page whose records ExitOS does not yet
// hold for them (offers, a cap table, NDAs) shows that plainly instead of the
// demo company's sample records. The demo example stays available, opened
// deliberately and labelled. Without an intake (demo mode) the page renders
// as before, since the whole console is then the demo company's.
export const DemoExample: React.FC<{
  fromIntake: boolean;
  /** The page's own heading, shown in founder mode above the empty state. */
  page: { id: string; eyebrow: string; title: string };
  /** What the founder does not have yet, e.g. "No offers recorded for your company". */
  title: string;
  /** Where their own records will come from. */
  children: React.ReactNode;
  demo: React.ReactNode;
}> = ({ fromIntake, page, title, children, demo }) => {
  const [show, setShow] = useState(false);
  if (!fromIntake) return <>{demo}</>;
  return (
    <div className="space-y-3 text-xo-text">
      {!show && <PageHeader eyebrow={page.eyebrow} title={page.title} badge={<Provenance kind="company" />} />}
      <section data-page={show ? undefined : page.id} className="border border-xo-line bg-xo-panel">
        <Empty title={title}>{children}</Empty>
        <div className="flex justify-center pb-5">
          <button type="button" aria-expanded={show} onClick={() => setShow((s) => !s)}
            className="rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
            {show ? "Hide the demo company's example" : "Show the demo company's example"}
          </button>
        </div>
      </section>
      {show && (
        <>
          <p role="note" className="border border-loi-400/50 bg-loi-500/10 px-4 py-2.5 text-[12px] font-semibold text-xo-text">Example only — the demo company's sample records below are not yours.</p>
          {demo}
        </>
      )}
    </div>
  );
};
