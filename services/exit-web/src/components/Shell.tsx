import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { CloseIcon, LockIcon, Toast } from "../lib/ui";
import { navForRole, needsUpgrade, GROUP_ORDER, ROLE_LABEL, type NavItem, type Role, type Plan } from "../lib/access";
import { ExchangeMark } from "./ExchangeMark";
import InstitutionalRibbon from "./InstitutionalRibbon";
import LayerBar from "./LayerBar";
import LayerSubNav from "./LayerSubNav";
import TermsDialog from "./TermsDialog";
import PageTip from "./PageTip";
import CommandPalette, { noteRecent } from "./CommandPalette";
import { guideState, markVisited, onGuideChange, setGuideHidden, setTipsHidden, ESSENTIALS, loadAllToolsOpen, saveAllToolsOpen } from "../lib/onboarding";

// Role-aware console rail. The navigation is driven by the access policy:
// founders, buyers, admins and superadmins see different command centers, and
// pro-only surfaces show a lock for free plans (linking to the upgrade screen).

const basePath = (to: string): string => to.split("#")[0];

// Routes that render as full-bleed workstations (one instrument, no centered
// column) rather than the standard document-width page.
const WORKSTATION_ROUTES = new Set([
  "/console", "/console/buyer-graph", "/console/acquisition-radar", "/console/inbox",
  "/console/valuation", "/console/readiness",
  "/console/indexes", "/console/outcomes", "/console/exit-timing", "/console/market-map",
  "/console/activity", "/console/engagement-registry", "/console/process-intel", "/console/outreach-plan", "/console/pipeline",
  "/console/buyer-portal", "/console/investors", "/console/buyers", "/console/buyer-copilot",
  "/console/commander", "/console/marketplace", "/console/nda", "/console/network",
  "/console/diligence-ai", "/console/data-room", "/console/documents", "/console/negotiator", "/console/simulator",
  "/console/closing", "/console/wealth", "/console/knowledge-graph",
]);

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const role: Role = session?.role ?? "founder";
  const plan: Plan = session?.plan ?? "free";
  const items = navForRole(role);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const showStarterNotice = role === "founder" && plan === "starter" && !noticeDismissed;

  // Pages opened in this browser — the "Opened" marks in the Start-here guide.
  // A plan-gated page shows the upgrade screen instead, so it is not marked.
  useEffect(() => { if (!needsUpgrade(loc.pathname, role, plan)) { markVisited(loc.pathname); noteRecent(loc.pathname); } }, [loc.pathname, role, plan]);
  const [guideHidden, setGuideHiddenState] = useState(() => guideState().hidden);
  const [tipsHidden, setTipsHiddenState] = useState(() => guideState().tipsHidden);
  useEffect(() => onGuideChange(() => { const g = guideState(); setGuideHiddenState(g.hidden); setTipsHiddenState(g.tipsHidden); }), []);
  const showGuideLink = guideHidden && (role === "founder" || role === "buyer");

  // The phone drawer behaves as a dialog: focus moves into it when it opens, Escape closes it, and focus
  // returns to the menu button.
  const drawer = React.useRef<HTMLElement>(null);
  const menuButton = React.useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!navOpen) return;
    const opener = menuButton.current;
    drawer.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setNavOpen(false); };
    addEventListener("keydown", onKey);
    return () => { removeEventListener("keydown", onKey); if (matchMedia("(max-width: 1023px)").matches) opener?.focus(); };
  }, [navOpen]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setNavOpen(false); }, [loc.pathname, loc.hash]);

  // The browser tab names the page ("Check Readiness · ExitOS"), so a reader with several console tabs can
  // tell them apart; the site's own title returns when the console closes.
  useEffect(() => { const site = document.title; return () => { document.title = site; }; }, []);
  useEffect(() => {
    const list = navForRole(role);
    const item = list.find((n) => basePath(n.to) === loc.pathname) ?? list.find((n) => n.to === "/console");
    document.title = `${loc.pathname === "/console/upgrade" ? "Upgrade" : item?.label ?? "Console"} · ExitOS`;
  }, [loc.pathname, role]);

  // A new page opens at its top: the workspace (<main>, the scrolling region) returns to 0 when the path
  // changes; a link to a section (#hash) is left to the effect below.
  const workspace = React.useRef<HTMLElement>(null);
  useEffect(() => { if (!loc.hash) workspace.current?.scrollTo({ top: 0 }); }, [loc.pathname, loc.hash]);

  // Scroll anchored sections into view when the hash changes.
  useEffect(() => {
    const id = loc.hash ? loc.hash.slice(1) : null;
    const t = setTimeout(() => { if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
    return () => clearTimeout(t);
  }, [loc.pathname, loc.hash]);

  const current = `${loc.pathname}${loc.hash}`;
  const isActive = (to: string): boolean => {
    if (to.includes("#")) return current === to;
    if (to === "/console") return loc.pathname === "/console" && loc.hash === "";
    return loc.pathname === to && loc.hash === "";
  };

  // Founders get a short Essentials list first; the rest sits under "All
  // tools". Operators and buyers keep the full list (it is already short).
  const shortMenu = role === "founder";
  const essentials = shortMenu ? ESSENTIALS.map((to) => items.find((n) => n.to === to)).filter((n): n is NavItem => !!n) : [];
  const rest = shortMenu ? items.filter((n) => !ESSENTIALS.includes(n.to)) : items;
  const [toolsOpen, setToolsOpen] = useState(loadAllToolsOpen);
  // The current page is always visible in the menu.
  const currentInRest = shortMenu && rest.some((n) => basePath(n.to) === loc.pathname) && !ESSENTIALS.includes(loc.pathname);
  useEffect(() => { if (currentInRest) setToolsOpen(true); }, [currentInRest]);
  // the menu keeps the current page in sight: its entry scrolls into the menu's view (not the page's) when the
  // page changes, so a page opened from the palette or a link is marked where the reader can see it
  const menu = React.useRef<HTMLElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const nav = menu.current, cur = nav?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!nav || !cur) return;
      const n = nav.getBoundingClientRect(), c = cur.getBoundingClientRect();
      if (c.top < n.top + 12 || c.bottom > n.bottom - 40) nav.scrollTop += c.top - n.top - n.height / 3; // clear of the faded edges
    }, 80);
    return () => clearTimeout(t);
  }, [loc.pathname, toolsOpen]);

  const toggleTools = (): void => { const v = !toolsOpen; setToolsOpen(v); saveAllToolsOpen(v); };
  const toolsId = "console-all-tools";

  const groups = rest.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] = acc[item.group] ?? []).push(item);
    return acc;
  }, {});

  const renderItem = (n: NavItem): React.ReactNode => {
    const active = isActive(n.to);
    const locked = needsUpgrade(basePath(n.to), role, plan);
    return (
      <Link
        key={`${n.to}-${n.group}`}
        to={locked ? "/console/upgrade" : n.to}
        aria-current={active ? "page" : undefined}
        onClick={() => setNavOpen(false)}
        className={`flex items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400 ${active
          ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40"
          : "text-white/70 hover:bg-white/5 hover:text-white"}`}
      >
        <span className="min-w-0">
          <span className={`block ${locked ? "text-white/45" : ""}`}>{n.label}</span>
          {n.name && !n.label.toLowerCase().includes(n.name.toLowerCase()) && <span className={`block text-[10.5px] font-normal ${locked ? "text-white/35" : "text-white/50"}`}>{n.name}</span>}
        </span>
        {locked && <span title="Upgrade to Pro" className="flex shrink-0 items-center gap-1 rounded-sm px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40 ring-1 ring-white/10"><LockIcon size={9} />Pro</span>}
      </Link>
    );
  };

  const subtitle = role === "buyer" ? "Buyer Access" : role === "admin" || role === "superadmin" ? "Operator Console" : "Founder Acquisition Suite";

  const Brand = (
    <div className="flex items-center gap-2.5">
      <ExchangeMark size={32} />
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-tight text-white">ExitOS</div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">{subtitle}</div>
      </div>
    </div>
  );

  return (
    <div className="ex-console flex h-full flex-col">
      {/* the first Tab: straight past the sidebar and the three header bars to the page */}
      <a href="#workspace" onClick={(e) => { e.preventDefault(); workspace.current?.focus(); }}
        className="sr-only z-[60] rounded-md bg-deal-700 px-4 py-2.5 text-[13px] font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-300">Skip to content</a>
      <div aria-hidden className="h-1 w-full bg-gradient-to-r from-deal-700 via-deal-500 to-loi-500" />

      {/* Mobile top bar */}
      <header className="flex items-center gap-3 border-b border-white/10 bg-ink-900/80 px-4 py-3 lg:hidden">
        <button ref={menuButton} onClick={() => setNavOpen(true)} aria-label="Open navigation menu" aria-expanded={navOpen}
          className="rounded-md p-2 text-white/80 ring-1 ring-white/15 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        {Brand}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {navOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" aria-hidden onClick={() => setNavOpen(false)} />}

        <aside ref={drawer}
          className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-white/10 bg-ink-900/95 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:bg-ink-900/70 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-label="Sidebar"
        >
          <div className="flex items-center justify-between px-5 py-5">
            {Brand}
            <button onClick={() => setNavOpen(false)} aria-label="Close navigation menu" className="rounded p-1 text-white/50 hover:text-white lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400"><CloseIcon /></button>
          </div>
          {/* go to any page by name: the command palette (⌘K / Ctrl+K) */}
          <div className="px-3 pb-2">
            <button type="button" onClick={() => setPaletteOpen(true)} aria-keyshortcuts="Meta+K Control+K"
              className="flex w-full items-center gap-2.5 rounded-md bg-white/[0.04] px-3 py-2 text-left text-[12.5px] text-white/55 ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <span className="flex-1">Go to a page</span>
              <kbd className="rounded border border-white/15 px-1.5 font-mono text-[10px] text-white/45">{typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"}</kbd>
            </button>
          </div>
          {/* the menu fades at its scrolling edges instead of cutting an item in half; a hairline scrollbar */}
          <nav ref={menu} aria-label="Console" className="ex-navscroll flex-1 overflow-y-auto px-3 py-2">
            {shortMenu && (
              <div className="mb-4">
                <div className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/55">Essentials</div>
                <div className="space-y-1">{essentials.map(renderItem)}</div>
                <button type="button" onClick={toggleTools} aria-expanded={toolsOpen} aria-controls={toolsId}
                  className="mt-3 flex w-full items-center justify-between rounded-md px-3 py-2 text-[12px] font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">
                  <span>All tools ({rest.length})</span>
                  <span aria-hidden className={`inline-block transition-transform ${toolsOpen ? "rotate-180" : ""}`}>▾</span>
                </button>
              </div>
            )}
            <div id={toolsId} hidden={shortMenu && !toolsOpen}>
            {GROUP_ORDER.filter((g) => groups[g]).map((group) => (
              <div key={group} className="mb-4">
                <div className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/55">{group}</div>
                <div className="space-y-1">
                  {groups[group]!.map(renderItem)}
                </div>
              </div>
            ))}
            </div>
          </nav>
          <div className="border-t border-white/10 px-4 py-3">
            {/* the account: initials in a ring beside the address */}
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-deal-600/20 font-mono text-[10px] font-semibold uppercase text-deal-200 ring-1 ring-deal-400/40">
                {(session?.email ?? "?").split("@")[0].split(/[._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("") || "?"}
              </span>
              <div className="min-w-0 truncate text-xs font-medium text-white/80">{session?.email}</div>
            </div>
            <div className="mb-2 mt-2 flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-white/70">{ROLE_LABEL[role]}</span>
              <span className={`rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide ${plan === "pro" ? "bg-deal-600/25 text-deal-300" : plan === "starter" ? "bg-loi-500/20 text-loi-300" : "bg-white/10 text-white/55"}`}>{plan}</span>
            </div>
            <button type="button" onClick={() => setTermsOpen(true)}
              className="mb-2 block rounded text-xs font-semibold text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">Plain-language terms</button>
            {tipsHidden && (
              <button type="button" onClick={() => setTipsHidden(false)}
                className="mb-2 block rounded text-xs font-semibold text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">Show page tips</button>
            )}
            {showGuideLink && (
              <Link to={role === "buyer" ? "/console/buyer-portal" : "/console"} onClick={() => setGuideHidden(false)}
                className="mb-2 block text-xs font-semibold text-white/70 hover:text-white">Show the Start-here guide</Link>
            )}
            {plan !== "pro" && (role === "founder" || role === "buyer") && (
              <Link to="/console/upgrade" className="mb-2 block text-xs font-semibold text-deal-300 hover:text-deal-200">Upgrade to Pro →</Link>
            )}
            <button onClick={() => { signOut(); nav("/"); }} className="rounded text-xs font-semibold text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">Sign out</button>
            <a href="/" className="ml-3 text-xs font-semibold text-white/45 hover:text-white/70">Home</a>
          </div>
        </aside>

        <main ref={workspace} id="workspace" tabIndex={-1} className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="sticky top-0 z-30">
            <InstitutionalRibbon />
            <LayerBar />
            <LayerSubNav />
          </div>
          {/* ambient reactor layer — the homepage exchange DNA, inside the
              console: faint market grid, a top liquidity glow, and the
              transaction-ring watermark. Ambient intelligence, not decoration. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(120,170,255,0.7) 0 1px, transparent 1px 110px), repeating-linear-gradient(0deg, rgba(120,170,255,0.5) 0 1px, transparent 1px 110px)", maskImage: "radial-gradient(ellipse at 50% 0%, #000, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, #000, transparent 70%)" }} />
            <div className="absolute -top-24 left-1/2 h-56 w-[70%] -translate-x-1/2 rounded-[50%] opacity-25 blur-[100px]"
              style={{ background: "radial-gradient(ellipse at center, rgba(56,130,246,0.35), transparent 70%)" }} />
            {/* ambient signal sweep — the desk scope refreshing */}
            <div className="ex-sweep absolute inset-x-0 top-0 h-44" style={{ background: "linear-gradient(to bottom, transparent, rgba(56,130,246,0.05), transparent)" }} />
            <svg className="absolute -right-32 top-24 h-[480px] w-[480px] opacity-[0.04]" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="33" stroke="#9CC2FF" strokeWidth="2" />
              <circle cx="50" cy="50" r="22" stroke="#9CC2FF" strokeWidth="1" />
              <g stroke="#9CC2FF" strokeWidth="2" strokeLinecap="round">
                <line x1="50" y1="11" x2="50" y2="21" /><line x1="50" y1="79" x2="50" y2="89" />
                <line x1="11" y1="50" x2="21" y2="50" /><line x1="79" y1="50" x2="89" y2="50" />
              </g>
              <circle cx="50" cy="50" r="6" fill="#9CC2FF" />
            </svg>
          </div>
          {showStarterNotice && (
            <div className="border-b border-loi-400/30 bg-loi-500/10">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
                <span className="flex items-center gap-2 text-[13px] text-loi-100"><svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-loi-300"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg><span><span className="font-semibold">Buyers are reviewing your listing.</span> Upgrade to Pro to open conversations, run outreach and continue with the agents.</span></span>
                <Link to="/console/upgrade" className="ml-auto rounded-md bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-deal-800">Upgrade to Pro →</Link>
                <button onClick={() => setNoticeDismissed(true)} aria-label="Dismiss" className="rounded p-1 text-white/45 hover:text-white"><CloseIcon size={12} /></button>
              </div>
            </div>
          )}
          {!tipsHidden && <div className="relative"><PageTip onHide={() => setTipsHidden(true)} /></div>}
          {WORKSTATION_ROUTES.has(loc.pathname)
            ? <div className="px-3 py-3 sm:px-4 lg:px-5 lg:py-4">{children}</div>   /* full-bleed command centers */
            : <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</div>}
        </main>
      </div>
      <TermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
      <CommandPalette items={items} role={role} plan={plan} open={paletteOpen} onOpenChange={setPaletteOpen}
        actions={[
          { label: "Plain-language terms", hint: "glossary definitions", run: () => setTermsOpen(true) },
          tipsHidden ? { label: "Show page tips", hint: "help", run: () => setTipsHidden(false) } : { label: "Hide page tips", hint: "help", run: () => setTipsHidden(true) },
          { label: "Sign out", hint: "log out leave", run: () => { signOut(); nav("/"); } },
        ]} />
      <Toast />
    </div>
  );
};

export default Shell;
