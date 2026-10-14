import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { canAccess, featureLabel, needsUpgrade, requiredEngagement, type Role, type Plan } from "../lib/access";
import { pageGuide } from "../lib/page-guide";

// The slim "what this page is for · next" bar above each console page.
// Not shown on a plan-gated page (the upgrade screen is what renders there).
const PageTip: React.FC<{ onHide: () => void }> = ({ onHide }) => {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const role: Role = session?.role ?? "founder";
  const plan: Plan = session?.plan ?? "free";
  if (needsUpgrade(pathname, role, plan)) return null;
  const g = pageGuide(pathname, role);
  if (!g) return null;
  const next = g.next && canAccess(g.next, role) ? g.next : undefined;
  const nextLabel = next ? featureLabel(next, role) : undefined;
  const gate = next ? requiredEngagement(next, role, plan) : null;
  return (
    <div data-guide="page-tip" className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-xo-line bg-xo-ink px-4 py-2 text-[12px] sm:px-5">
      <p className="min-w-0 flex-1 basis-full text-xo-muted sm:basis-0"><span className="font-semibold text-xo-text">This page: </span>{g.purpose}</p>
      {next && nextLabel && (
        <Link to={next} className="shrink-0 rounded-[6px] border border-xo-action/40 bg-xo-panel px-3 py-1 font-medium text-xo-action transition hover:border-xo-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
          Next: {nextLabel} <span aria-hidden>→</span>{gate && <span className="ml-1 font-normal text-xo-caution">(needs {gate})</span>}
        </Link>
      )}
      <button type="button" onClick={onHide}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-1 py-0.5 text-[11px] text-xo-faint hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
        <svg aria-hidden width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="8" r="6.5" /><path d="M6.2 6.2a1.9 1.9 0 0 1 3.6.8c0 1.3-1.8 1.6-1.8 2.7M8 11.6v.1" strokeLinecap="round" /></svg>
        Hide page tips
      </button>
    </div>
  );
};

export default PageTip;
