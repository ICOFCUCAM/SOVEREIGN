import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyAuthority, type MyAuthority } from "../lib/api";
import { ClassBadge } from "../lib/ui";

// THE OFFICE HOME — institutional operations made visible. In an institution,
// authority belongs to an OFFICE; a person OCCUPIES that office. So the operator
// does not log in to "a dashboard" — they arrive at THEIR office, and see the
// official records under their authority. Everything here is derived from real
// governance state (offices held + the open step of each record's policy chain);
// no scope, no credential, no engine vocabulary ever surfaces.

const waited = (iso?: string | null): string => {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return "just now";
};

const greeting = (): string => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

// An office label often already names itself an Office/Secretariat/Bureau; only
// prefix "Office of the" when it reads naturally (e.g. a person-titled office).
const officeHeading = (label: string): string =>
  /\b(office|secretariat|bureau|division|directorate|registry|chancery)\b/i.test(label)
    ? label : `Office of the ${label}`;

const OfficeHome: React.FC<{ subject?: string }> = ({ subject }) => {
  const [a, setA] = useState<MyAuthority | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { let live = true; getMyAuthority().then((r) => live && setA(r)).catch(() => {}).finally(() => live && setLoaded(true)); return () => { live = false; }; }, []);

  // A principal who holds no office (e.g. a pure author) has no office home — the
  // rest of the surface serves them. Render nothing rather than an empty shell.
  if (!loaded || !a || a.offices.length === 0) return null;

  const queue = a.underYourAuthority;
  const primary = a.offices[0];
  // Who is the operator? Prefer the real person name from governance; fall back to
  // the token subject. This is the institutional crest — name, office, institution.
  const name = a.identity?.name || (subject ? subject.replace(/^svc:/, "").split("@")[0] : null);
  const institution = a.identity?.institution || null;
  const others = a.offices.slice(1);

  // What does the queue mean for THIS office? Publishers publish; reviewers decide.
  const allPublish = queue.length > 0 && queue.every((r) => r.action === "publish");
  const allDecide = queue.length > 0 && queue.every((r) => r.action !== "publish");
  const awaitingLabel = queue.length === 0 ? "Your office is clear"
    : allPublish ? "Awaiting your publication" : allDecide ? "Awaiting your decision" : "Under your authority";

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-seal-light/25 bg-gradient-to-br from-seal/[0.14] via-white/[0.025] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      {/* ── Institutional identity crest ── */}
      <div className="px-6 pt-5 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.28em] text-seal-light">{institution || "Your Authority"}</div>
          {name && <div className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/30">{greeting()}</div>}
        </div>
        <div className="mt-2.5 font-serif text-[2rem] font-bold leading-none tracking-tight text-white">{name || officeHeading(primary.label)}</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13.5px]">
          <span className="font-semibold text-white/90">{primary.label}</span>
          {primary.department && <><span className="text-white/20" aria-hidden>·</span><span className="text-white/55">{primary.department}</span></>}
          {primary.delegated && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300" title="held by delegation">Acting</span>}
          {a.identity?.isMachine && <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/40" title="a machine credential holds this office">Service credential</span>}
        </div>
        {others.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">also</span>
            {others.map((o) => (
              <span key={o.key} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-white/70 ring-1 ring-white/12">
                {o.label}{o.delegated && <span className="text-amber-300/80" title="held by delegation"> · acting</span>}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* ── Today band — the work waiting ── */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] bg-white/[0.015] px-6 py-3 sm:px-7">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">Today</div>
        <div className="flex items-baseline gap-2.5">
          <span className={`font-mono text-2xl font-bold tabular-nums ${queue.length > 0 ? "text-white" : "text-emerald-400/70"}`}>{queue.length || "✓"}</span>
          <span className="text-[12.5px] font-medium text-white/60">{queue.length > 0 ? <>{awaitingLabel} · {queue.length === 1 ? "1 Official Record" : `${queue.length} Official Records`}</> : awaitingLabel}</span>
        </div>
      </div>

      {queue.length > 0 ? (
        <ul className="divide-y divide-white/[0.06] border-t border-white/[0.07]">
          {queue.slice(0, 6).map((r) => (
            <li key={r.documentId}>
              <Link to={`/console/documents/${r.documentId}`} className="flex items-center gap-4 px-6 py-3 transition hover:bg-white/[0.04] sm:px-7">
                <ClassBadge level={r.classification?.level} scheme={r.classification?.scheme} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{r.title || "(untitled)"}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-white/45">
                    {r.action === "publish" ? (
                      <>Rendered · ready for your publication as <span className="text-white/70">{r.currentAuthority}</span></>
                    ) : (
                      <>Awaiting you as <span className="text-white/70">{r.currentAuthority}</span>
                        {r.nextAuthority && <> · then <span className="text-white/55">{r.nextAuthority}</span></>}</>
                    )}
                    {r.viaDelegation && <span className="text-amber-300/80"> · by delegation</span>}
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="font-mono text-[12px] tabular-nums text-white/60">{waited(r.waitingSince)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-white/30">waiting</div>
                </div>
                <span className="rounded-md bg-seal px-3 py-1.5 text-[12px] font-semibold text-white">{r.action === "publish" ? "Publish →" : "Decide →"}</span>
              </Link>
            </li>
          ))}
          {queue.length > 6 && (
            <li className="px-6 py-2.5 sm:px-7"><Link to="/console/review" className="text-[12px] font-semibold text-seal-light hover:underline">View all {queue.length} records under your authority →</Link></li>
          )}
        </ul>
      ) : null}
    </section>
  );
};

export default OfficeHome;
