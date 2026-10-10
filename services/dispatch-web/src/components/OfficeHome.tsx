import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyAuthority, type MyAuthority } from "../lib/api";
import { waited } from "../lib/format";
import { recordTypeLabel } from "../lib/recordTypes";
import { Badge, ClassificationMark, Skeleton, cx } from "./console/ds";
import { Icon } from "./console/icons";

// THE OFFICE HOME — institutional operations made visible. In an institution,
// authority belongs to an OFFICE; a person OCCUPIES it. So the operator does not
// log in to "a dashboard" — they arrive at THEIR office, and see the official
// records under their authority. Everything here is derived from real governance
// state (offices held + the open step of each record's policy chain); no scope,
// no credential, no engine vocabulary ever surfaces.

const greeting = (): string => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

// An office label often already names itself an Office/Secretariat/Bureau; only
// prefix "Office of the" when it reads naturally (e.g. a person-titled office).
const officeHeading = (label: string): string =>
  /\b(office|secretariat|bureau|division|directorate|registry|chancery)\b/i.test(label)
    ? label : `Office of the ${label}`;

const OfficeHome: React.FC<{ subject?: string; refreshKey?: number }> = ({ subject, refreshKey = 0 }) => {
  const [a, setA] = useState<MyAuthority | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { let live = true; getMyAuthority().then((r) => live && setA(r)).catch(() => {}).finally(() => live && setLoaded(true)); return () => { live = false; }; }, [refreshKey]);

  // A principal who holds no office (e.g. a pure author) has no office home — the
  // rest of the surface serves them. Render nothing rather than an empty shell.
  if (!loaded) return (
    <div role="status" aria-label="Loading your office" className="mb-6 rounded-xl border border-sd-line bg-sd-panel px-5 py-4">
      <Skeleton className="h-3 w-40" /><Skeleton className="mt-3 h-6 w-64" /><Skeleton className="mt-2 h-3.5 w-52" />
    </div>
  );
  if (!a || a.offices.length === 0) return null;

  const queue = a.underYourAuthority;
  const primary = a.offices[0];
  const name = a.identity?.name || (subject ? subject.replace(/^svc:/, "").split("@")[0] : null);
  const institution = a.identity?.institution || null;
  const others = a.offices.slice(1);

  // What does the queue mean for THIS office? Publishers publish; reviewers decide.
  const allPublish = queue.length > 0 && queue.every((r) => r.action === "publish");
  const allDecide = queue.length > 0 && queue.every((r) => r.action !== "publish");
  const awaitingLabel = queue.length === 0 ? "Your office is clear"
    : allPublish ? "Awaiting your publication" : allDecide ? "Awaiting your decision" : "Under your authority";

  return (
    <section aria-label="Your office" className="mb-6 overflow-hidden rounded-xl border border-sd-accent/30 bg-sd-panel">
      <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-sd-accent">
            <Icon.building className="h-3.5 w-3.5" />{institution || "Your authority"}
            {name && <span className="font-semibold normal-case tracking-normal text-sd-text3">· {greeting()}</span>}
          </div>
          <div className="mt-1.5 font-serif text-[24px] font-semibold leading-tight tracking-[-0.01em] text-sd-text">{name || officeHeading(primary.label)}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <span className="font-semibold text-sd-text">{primary.label}</span>
            {primary.department && <><span className="text-sd-faint" aria-hidden>·</span><span className="text-sd-text2">{primary.department}</span></>}
            {primary.delegated && <Badge tone="warn" title="Held by delegation">Acting</Badge>}
            {a.identity?.isMachine && <Badge tone="neutral" title="A machine credential holds this office">Service credential</Badge>}
          </div>
          {others.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sd-text3">Also holds</span>
              {others.map((o) => <Badge key={o.key} tone="neutral" title={o.delegated ? "Held by delegation" : undefined}>{o.label}{o.delegated && " · acting"}</Badge>)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 md:text-right">
          <div className={cx("font-mono text-[30px] font-semibold leading-none tabular-nums", queue.length > 0 ? "text-sd-text" : "text-sd-ok")}>{queue.length > 0 ? queue.length : <Icon.check className="h-7 w-7" />}</div>
          <div className="leading-tight">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-sd-text3">Today</div>
            <div className="text-[13px] font-semibold text-sd-text2">{awaitingLabel}</div>
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <ul className="divide-y divide-sd-soft border-t border-sd-soft">
          {queue.slice(0, 6).map((r) => (
            <li key={r.documentId}>
              <Link to={`/console/documents/${r.documentId}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-5 py-2.5 transition-colors hover:bg-sd-raised sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
                <ClassificationMark level={r.classification?.level} scheme={r.classification?.scheme} />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-sd-text">{r.title || "(untitled)"}</div>
                  <div className="truncate text-[12px] text-sd-text3">
                    {recordTypeLabel(r.docType)} · {r.action === "publish"
                      ? <>ready for your publication as <span className="text-sd-text2">{r.currentAuthority}</span></>
                      : <>awaiting you as <span className="text-sd-text2">{r.currentAuthority}</span>{r.nextAuthority && <> · then {r.nextAuthority}</>}</>}
                    {r.viaDelegation && <span className="text-sd-warn"> · by delegation</span>}
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="font-mono text-[12px] tabular-nums text-sd-text2">{waited(r.waitingSince)}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.08em] text-sd-text3">waiting</div>
                </div>
                <span className={cx("inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[12px] font-semibold", r.action === "publish" ? "bg-[#1f5c45] text-white" : "bg-sd-accentbg text-sd-accentink")}>
                  {r.action === "publish" ? "Publish" : "Decide"}<Icon.arrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          ))}
          {queue.length > 6 && (
            <li className="px-5 py-2.5"><Link to="/console/review" className="text-[12.5px] font-semibold text-sd-accent hover:underline">View all {queue.length} records under your authority →</Link></li>
          )}
        </ul>
      )}
    </section>
  );
};

export default OfficeHome;
