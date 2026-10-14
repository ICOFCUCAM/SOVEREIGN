import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LockIcon } from "../lib/ui";
import { GROUP_ORDER, type NavItem, type Role } from "../lib/access";
import { menuSummary } from "../lib/menu-summaries";
import { HintCard, HintToggle, useHint } from "./HintCard";

// ── THE EXIT SPINE ──────────────────────────────────────────────────
// The console menu drawn as the exit itself: the tool groups are the stages of a sale (prepare,
// market, transact, transition), threaded on one vertical spine. The spine is lit in bronze from the
// first stage down to the stage of the page you are on, so the menu always shows where you stand in
// the process; that stage's node glows and its tools are open. Other stages fold to a single line
// with their count and open on demand (remembered in this browser). Collapsed, the rail keeps only
// the spine and its numbered nodes. Nothing here grants access: locked tools still lead to the
// upgrade page, and the server decides what any page may do.

export interface Stage { readonly numeral: string; readonly title: string; readonly caption: string }
/** Each menu group as a stage of the exit, in order. Groups not listed keep their own name. */
export const STAGES: Readonly<Record<string, Stage>> = {
  Mandate: { numeral: "I", title: "Prepare", caption: "value, readiness, story, data room" },
  "Market Intelligence": { numeral: "II", title: "Market", caption: "acquirers, sectors, demand" },
  Exchange: { numeral: "III", title: "Transact", caption: "listing, NDAs, offers, closing" },
  Wealth: { numeral: "IV", title: "Transition", caption: "after the sale" },
  Overview: { numeral: "I", title: "Overview", caption: "your mandate and activity" },
  Marketplace: { numeral: "I", title: "Discover", caption: "opportunities and acquirers" },
  Deals: { numeral: "II", title: "Transact", caption: "NDAs, data rooms, transactions" },
  Admin: { numeral: "·", title: "Operations", caption: "accounts and calibration" },
};
const stageOf = (group: string): Stage => STAGES[group] ?? { numeral: "·", title: group, caption: "" };

const OPEN_KEY = "exitos.spine.open.v1";
const loadOpen = (): string[] => { try { return JSON.parse(localStorage.getItem(OPEN_KEY) ?? "[]") as string[]; } catch { return []; } };
const saveOpen = (v: string[]): void => { try { localStorage.setItem(OPEN_KEY, JSON.stringify(v)); } catch { /* storage unavailable: not remembered */ } };

interface Props {
  readonly items: readonly NavItem[];          // the stage tools (pinned ones excluded)
  readonly pinned: readonly NavItem[];         // "Start here": the founder's essentials
  readonly isActive: (to: string) => boolean;
  readonly isLocked: (to: string) => boolean;
  readonly collapsed: boolean;
  readonly onNavigate: () => void;
  readonly pathname: string;
  readonly role: Role;
}

/** One tool in the menu, with its summary on hover, keyboard focus or (touch) its ⓘ. */
const MenuRow: React.FC<{ n: NavItem; inStage: boolean; active: boolean; locked: boolean; role: Role; onNavigate: () => void }> = ({ n, inStage, active, locked, role, onNavigate }) => {
  const sub = n.name && !n.label.toLowerCase().includes(n.name.toLowerCase()) ? n.name : null;
  const hint = useHint();
  const summary = menuSummary(n.to, role);
  return (
    <li className="relative flex items-center">
      {inStage && <span aria-hidden className={`absolute left-[-13px] top-1/2 h-px w-[9px] transition-colors ${active ? "bg-ex-bronze" : "bg-transparent"}`} />}
      <Link to={locked ? "/console/upgrade" : n.to} aria-current={active ? "page" : undefined} onClick={onNavigate} {...(summary ? hint.bind : {})}
        className={`group/row flex min-w-0 flex-1 items-center gap-2 rounded-[3px] px-2.5 py-[7px] text-[12.5px] leading-tight transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze ${active
          ? "bg-gradient-to-r from-ex-bronze/[0.16] to-transparent text-ex-ivory shadow-[inset_2px_0_0_0_#B49A75]"
          : "text-white/60 hover:bg-white/[0.035] hover:text-white/90"}`}>
        <span className="min-w-0 flex-1 truncate">
          <span className={locked ? "text-white/40" : ""}>{n.label}</span>
          {active && sub && <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-[0.16em] text-ex-bronze/80">{sub}</span>}
        </span>
        {locked && <span className="flex shrink-0 items-center gap-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/35"><LockIcon size={8} />{n.starter ? "Prep" : "Pro"}</span>}
      </Link>
      {summary && <HintToggle hint={hint} label={n.label} />}
      {summary && <HintCard hint={hint} title={n.label} what={summary.what} kind={summary.kind} plan={summary.plan} />}
    </li>
  );
};

export const DealSpine: React.FC<Props> = ({ items, pinned, isActive, isLocked, collapsed, onNavigate, pathname, role }) => {
  const groups = GROUP_ORDER.filter((g) => items.some((n) => n.group === g)).map((g) => ({ group: g, stage: stageOf(g), tools: items.filter((n) => n.group === g) }));
  // the stage of the page you are on, whether it is a stage tool or a pinned "Start here" page
  const currentGroup = [...items, ...pinned].find((n) => isActive(n.to) && groups.some((g) => g.group === n.group))?.group ?? null;
  const currentIsPinned = pinned.some((n) => isActive(n.to));
  const currentIndex = groups.findIndex((g) => g.group === currentGroup);

  const [open, setOpen] = useState<string[]>(loadOpen);
  // the stage of the page you are on is always open
  useEffect(() => { if (currentGroup && !currentIsPinned && !open.includes(currentGroup)) setOpen((o) => [...o, currentGroup]); }, [currentGroup, currentIsPinned]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (g: string): void => setOpen((o) => { const v = o.includes(g) ? o.filter((x) => x !== g) : [...o, g]; saveOpen(v); return v; });

  // the lit length of the spine: from its top to the centre of the current stage's node
  const spine = useRef<HTMLOListElement>(null);
  const [lit, setLit] = useState(0);
  useLayoutEffect(() => {
    const el = spine.current; if (!el) return;
    const measure = (): void => {
      const node = currentGroup ? el.querySelector<HTMLElement>(`[data-stage="${CSS.escape(currentGroup)}"] [data-node]`) : null;
      if (!node) { setLit(0); return; }
      const n = node.getBoundingClientRect(), o = el.getBoundingClientRect();
      setLit(n.top + n.height / 2 - o.top);
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, [currentGroup, open, collapsed, pathname]);

  const row = (n: NavItem, inStage: boolean): React.ReactNode => (
    <MenuRow key={`${n.to}-${n.group}`} n={n} inStage={inStage} active={isActive(n.to)} locked={isLocked(n.to)} role={role} onNavigate={onNavigate} />
  );

  if (collapsed) {
    // the spine alone: one numbered node per stage, each leading to the stage's first tool
    return (
      <ol ref={spine} aria-label="Stages of the exit" className="relative mx-auto flex w-full flex-col items-center gap-5 py-3">
        <span aria-hidden className="absolute bottom-3 top-3 w-px bg-ex-hair" />
        <span aria-hidden className="absolute top-3 w-px bg-gradient-to-b from-ex-bronze/40 to-ex-bronze transition-[height] duration-500 ease-out" style={{ height: Math.max(0, lit - 12) }} />
        {groups.map((g, i) => {
          const first = g.tools.find((n) => !isLocked(n.to)) ?? g.tools[0]!;
          const here = g.group === currentGroup, passed = currentIndex > i;
          return (
            <li key={g.group} data-stage={g.group} className="relative">
              <Link data-node to={isLocked(first.to) ? "/console/upgrade" : first.to} onClick={onNavigate} title={`${g.stage.numeral} · ${g.stage.title}: ${g.stage.caption}`} aria-current={here ? "location" : undefined}
                className={`relative grid h-8 w-8 place-items-center rounded-full font-mono text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze ${here
                  ? "bg-ex-bronze text-ex-graphite shadow-[0_0_0_4px_rgba(180,154,117,0.16),0_0_18px_rgba(180,154,117,0.45)]"
                  : passed ? "bg-ex-graphite text-ex-bronze ring-1 ring-ex-bronze/70" : "bg-ex-graphite text-white/50 ring-1 ring-white/15 hover:text-white/80"}`}>
                {g.stage.numeral}
              </Link>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div>
      {pinned.length > 0 && (
        <section aria-label="Start here" className="mb-5">
          <h2 className="mb-1.5 flex items-center gap-2 px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.26em] text-white/45">
            <span aria-hidden className="h-px w-3 bg-ex-bronze/60" />Start here
          </h2>
          <ul className="space-y-px">{pinned.map((n) => row(n, false))}</ul>
        </section>
      )}
      <ol ref={spine} aria-label="Stages of the exit" className="relative">
        {/* the spine: a hairline through every stage, lit in bronze down to the stage you are in */}
        <span aria-hidden className="absolute bottom-2 left-[13px] top-2 w-px bg-ex-hair" />
        <span aria-hidden className="absolute left-[13px] top-2 w-px bg-gradient-to-b from-ex-bronze/30 via-ex-bronze/80 to-ex-bronze shadow-[0_0_8px_rgba(180,154,117,0.5)] transition-[height] duration-500 ease-out" style={{ height: Math.max(0, lit - 8) }} />
        {groups.map((g, i) => {
          const here = g.group === currentGroup, passed = currentIndex > i, isOpen = open.includes(g.group);
          const id = `stage-${i}`;
          return (
            <li key={g.group} data-stage={g.group} className="relative pb-3">
              <button type="button" onClick={() => toggle(g.group)} aria-expanded={isOpen} aria-controls={id}
                className="group/stage flex w-full items-center gap-2.5 rounded-[3px] py-1.5 pr-2 text-left transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze">
                <span data-node aria-hidden className={`relative z-10 ml-[6px] grid h-[15px] w-[15px] shrink-0 rotate-45 place-items-center transition ${here
                  ? "bg-ex-bronze shadow-[0_0_0_4px_rgba(180,154,117,0.14),0_0_14px_rgba(180,154,117,0.55)]"
                  : passed ? "bg-ex-graphite ring-1 ring-ex-bronze/80" : "bg-ex-graphite ring-1 ring-white/20"}`}>
                  <span className={`-rotate-45 font-mono text-[7px] font-bold leading-none ${here ? "text-ex-graphite" : passed ? "text-ex-bronze" : "text-white/45"}`}>{g.stage.numeral}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-mono text-[10px] font-semibold uppercase tracking-[0.24em] ${here ? "text-ex-ivory" : "text-white/55 group-hover/stage:text-white/80"}`}>{g.stage.title}</span>
                  {(here || isOpen) && g.stage.caption && <span className="block truncate text-[10.5px] text-white/35">{g.stage.caption}</span>}
                </span>
                <span className="font-mono text-[9.5px] tabular-nums text-white/35">{String(g.tools.length).padStart(2, "0")}</span>
                <span aria-hidden className={`text-[9px] text-white/35 transition-transform ${isOpen ? "rotate-90" : ""}`}>▸</span>
              </button>
              <ul id={id} hidden={!isOpen} className="ml-[26px] mt-0.5 space-y-px">{g.tools.map((n) => row(n, true))}</ul>
            </li>
          );
        })}
      </ol>
      {currentGroup && (
        <p className="mt-1 flex items-center gap-2 px-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
          <span aria-hidden className="h-1 w-1 rounded-full bg-ex-bronze shadow-[0_0_6px_rgba(180,154,117,0.9)]" />
          You are here <span className="text-ex-bronze">{stageOf(currentGroup).numeral} · {stageOf(currentGroup).title}</span>
        </p>
      )}
    </div>
  );
};
