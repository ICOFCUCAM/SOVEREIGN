import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useBilling, QuotaMeter, UpgradeModal } from "../lib/upsell";
import { Icon } from "./console/icons";
import { Kbd, cx } from "./console/ds";
import { PAGE_GUIDE, guideFor, scopeMeaning } from "../lib/console-guide";

// TWO DISTINCT PRODUCTS on one platform, not one console with two menus. A
// ministry publication officer (Operations) and a systems integrator / security
// admin (Administration) never see each other's surfaces — different navigation,
// different mental model, different home. Records and governance live entirely
// in Operations; identity, credentials, integrations, policy and data residency
// live entirely in Administration. The shell is parameterised by `variant`; the
// route guards (App.tsx) keep operators out of /admin and vice-versa.
export type ConsoleVariant = "operations" | "administration";

type NavItem = { to: string; label: string; scope?: string; end?: boolean; group?: string; icon?: keyof typeof Icon; key?: string };

// Operations navigation. Scopes are unchanged (role-filtered exactly as before);
// the Document studio route already existed at /console/polished but had no
// navigation entry — it is now reachable from the rail.
const OPERATIONS_NAV: NavItem[] = [
  { to: "/console", label: "Command centre", end: true, icon: "command", group: "Operations", key: "1" },
  { to: "/console/create", label: "Create official record", scope: "dispatch:render", icon: "plus", group: "Operations", key: "2" },
  { to: "/console/review", label: "Governance review", scope: "dispatch:approve", icon: "review", group: "Operations", key: "3" },
  { to: "/console/library", label: "Official records", scope: "dispatch:read", icon: "register", group: "The record", key: "4" },
  { to: "/console/archives", label: "Preservation", scope: "dispatch:read", icon: "archive", group: "The record", key: "5" },
  { to: "/console/audit", label: "Evidence chain", scope: "dispatch:audit", icon: "evidence", group: "The record", key: "6" },
  { to: "/console/polished", label: "Document studio", icon: "studio", group: "Studio", key: "7" },
];

// The menu shows each page's task name (lib/console-guide) with the page's own title under it; `label`
// stays the page title, which the breadcrumb and the page heading use.
const taskName = (n: NavItem): string => PAGE_GUIDE[n.to]?.task ?? n.label.replace(/ ↗$/, "");
const GUIDE_KEY = "sd.guide.hidden";
const RAIL_KEY = "sd.rail.folded";
const readFolded = (): boolean => { try { return localStorage.getItem(RAIL_KEY) === "1"; } catch { return false; } };
const writeFolded = (v: boolean): void => { try { if (v) localStorage.setItem(RAIL_KEY, "1"); else localStorage.removeItem(RAIL_KEY); } catch { /* the choice lasts this visit */ } };
const readGuideHidden = (): boolean => { try { return localStorage.getItem(GUIDE_KEY) === "1"; } catch { return false; } };
const writeGuideHidden = (v: boolean): void => { try { if (v) localStorage.setItem(GUIDE_KEY, "1"); else localStorage.removeItem(GUIDE_KEY); } catch { /* unavailable: the choice lasts this visit */ } };

// Administration is organised the way an institution is set up and run: the institution itself
// (its set-up, people and offices, approval rules; the set-up opens full screen), oversight (is it working), connections (systems that use
// Dispatch) and assurance (what you show an auditor) — not a flat list of database tables.
const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Posture", end: true, icon: "shield" },
  { to: "/setup", label: "Establish Institution", scope: "dispatch:admin", group: "Your institution", icon: "building" },
  { to: "/admin/authority", label: "Authority Directory", scope: "dispatch:admin", group: "Your institution", icon: "users" },
  { to: "/admin/governance", label: "Policy", scope: "dispatch:admin", group: "Your institution", icon: "rules" },
  { to: "/admin/monitor", label: "Oversight", scope: "dispatch:read", group: "Oversight", icon: "activity" },
  { to: "/admin/compliance", label: "Audit & Compliance", scope: "dispatch:read", group: "Oversight", icon: "evidence" },
  { to: "/admin/intelligence", label: "Intelligence", scope: "dispatch:read", group: "Oversight", icon: "chart" },
  { to: "/admin/access", label: "API Access", scope: "dispatch:admin", group: "Connections", icon: "key" },
  { to: "/admin/integrations", label: "Integrations", group: "Connections", icon: "plug" },
  { to: "/admin/intake", label: "Direct DDM Intake", scope: "dispatch:render", group: "Connections", icon: "upload" },
  { to: "/admin/publishing", label: "Publishing Platform", scope: "dispatch:admin", group: "Connections", icon: "globe" },
  { to: "/admin/trust", label: "Trust", scope: "dispatch:read", group: "Assurance", icon: "seal" },
  { to: "/admin/sovereignty", label: "Data Sovereignty", group: "Assurance", icon: "lock" },
  { to: "/admin/deployment", label: "Deployment", group: "Assurance", icon: "server" },
  { to: "/admin/resilience", label: "Operational Resilience", group: "Assurance", icon: "lifebuoy" },
  { to: "/admin/evidence", label: "Evaluation Package", scope: "dispatch:read", group: "Assurance", icon: "package" },
  { to: "/evaluate", label: "Executive Evaluation ↗", scope: "dispatch:read", group: "Assurance", icon: "external" },
];

const PRODUCT: Record<ConsoleVariant, { label: string; tag: string; nav: NavItem[]; home: string }> = {
  operations: { label: "Operations", tag: "Records & governance", nav: OPERATIONS_NAV, home: "/console" },
  administration: { label: "Administration", tag: "Identity & platform", nav: ADMIN_NAV, home: "/admin" },
};

// Breadcrumb label for the current route (falls back to the product name).
function crumbFor(pathname: string, nav: NavItem[]): string {
  if (/^\/console\/documents\//.test(pathname)) return "Record file";
  const hit = [...nav].sort((a, b) => b.to.length - a.to.length).find((n) => (n.end ? pathname === n.to || pathname === n.to + "/" : pathname.startsWith(n.to)));
  return hit?.label.replace(/ ↗$/, "") ?? "";
}

// Remaining session time — the real token expiry, not an invented "secure" claim.
const useSessionClock = (expiresAt?: number): { label: string; minutes: number } | null => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(t); }, []);
  if (!expiresAt) return null;
  const m = Math.max(0, Math.round((expiresAt - now) / 60000));
  return { label: m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`, minutes: m };
};

// "Go to a page" — every page the principal may open, in both products, found by its task name, its
// page title or what it is for. Arrow keys move, Enter opens, Escape closes.
type PaletteItem = NavItem & { product: string };
const PagePalette: React.FC<{ pages: PaletteItem[]; onClose: () => void; onGo: (to: string) => void }> = ({ pages, onClose, onGo }) => {
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  // pages whose name matches come first, then those whose description does
  const named = (p: PaletteItem) => terms.every((t) => `${taskName(p)} ${p.label}`.toLowerCase().includes(t));
  const hits = pages.filter((p) => { const hay = `${taskName(p)} ${p.label} ${PAGE_GUIDE[p.to]?.summary ?? ""} ${p.group ?? ""} ${p.product}`.toLowerCase(); return terms.every((t) => hay.includes(t)); })
    .sort((a, b) => Number(named(b)) - Number(named(a)));
  useEffect(() => setAt(0), [q]);
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setAt((i) => Math.min(hits.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAt((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" && hits[at]) { e.preventDefault(); onGo(hits[at].to); }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-[#05080dcc] px-4 pt-[12vh]" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Go to a page" className="w-full max-w-lg overflow-hidden rounded-xl border border-sd-line bg-[#0e1622] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-sd-soft px-4">
          <Icon.search className="h-4 w-4 text-sd-text3" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={key} placeholder="Go to a page…" aria-label="Page name"
            role="combobox" aria-expanded="true" aria-controls="sd-palette-list" aria-activedescendant={hits[at] ? `sd-pal-${at}` : undefined}
            className="h-12 flex-1 bg-transparent text-[14px] text-sd-text placeholder:text-sd-text3 focus:outline-none" />
          <Kbd>Esc</Kbd>
        </div>
        <ul id="sd-palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto py-1.5">
          {hits.length === 0 && <li className="px-4 py-3 text-[13px] text-sd-text3">No page matches “{q}”.</li>}
          {hits.map((p, i) => (
            <li key={p.product + p.to} id={`sd-pal-${i}`} role="option" aria-selected={i === at} onMouseEnter={() => setAt(i)} onClick={() => onGo(p.to)}
              className={cx("mx-1.5 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2", i === at ? "bg-[#16263a]" : "")}>
              {p.icon ? React.createElement(Icon[p.icon], { className: cx("h-4 w-4 shrink-0", i === at ? "text-sd-gold" : "text-sd-text3") }) : <span className="w-4" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-sd-text">{taskName(p)}</span>
                <span className="block truncate text-[11.5px] text-sd-text3">{PAGE_GUIDE[p.to]?.summary ?? p.label}</span>
              </span>
              <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sd-faint">{p.product}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ConsoleShell: React.FC<{ children: React.ReactNode; variant?: ConsoleVariant }> = ({ children, variant = "operations" }) => {
  const { session, signOut, has } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { billing, setBilling } = useBilling();
  const [upgrade, setUpgrade] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [guideHidden, setGuideHidden] = useState(readGuideHidden);
  const [tip, setTip] = useState<{ to: string; top: number } | null>(null);
  // the rail folds to its icons on wide screens ("[" or the button); the drawer on small screens never folds
  const [foldedPref, setFoldedPref] = useState(readFolded);
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  const folded = foldedPref && wide;
  const toggleFold = (): void => { setFoldedPref((f) => { writeFolded(!f); return !f; }); setTip(null); };
  const [palette, setPalette] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);
  const focusPage = useRef(false);
  const product = PRODUCT[variant];
  const items = product.nav.filter((n) => !n.scope || has(n.scope));
  // The switcher only appears for principals who can actually use the other
  // product. Administration is gated on dispatch:admin; Operations on any
  // operating scope. A pure operator never even learns Administration exists.
  const canAdmin = has("dispatch:admin");
  const other = variant === "operations" ? "administration" : "operations";
  const showSwitch = other === "administration" ? canAdmin : true;
  const crumb = crumbFor(pathname, product.nav);
  // every page this principal may open, in both products, for "Go to a page"
  const reachable = [...items.map((n) => ({ ...n, product: product.label })),
    ...(showSwitch ? PRODUCT[other].nav.filter((n) => !n.scope || has(n.scope)).map((n) => ({ ...n, product: PRODUCT[other].label })) : [])];
  const remaining = useSessionClock(session?.expiresAt);
  const guide = guideFor(pathname);
  const nextPage = guide?.next && (!guide.next.scope || has(guide.next.scope)) ? guide.next.to : null;
  const hideGuide = (v: boolean): void => { setGuideHidden(v); writeGuideHidden(v); };
  const showTip = (to: string, el: HTMLElement): void => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return; // the drawer on small screens has no room beside it
    setTip({ to, top: el.getBoundingClientRect().top });
  };
  const roleLine = (): string => {
    if (session?.kind === "person") return has("dispatch:admin") ? "Person · administrator" : has("dispatch:approve") ? "Person · office holder" : "Person";
    return has("dispatch:admin") ? "Administrator key" : "System key";
  };
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  // Close the mobile drawer on navigation; move focus to the page for screen readers.
  // (navigating from the drawer sends focus to the page, not back to the menu button)
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    if (wasOpen.current) { focusPage.current = true; setMenuOpen(false); return; } // focus once the drawer has closed
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  // Mobile browser chrome matches the console ground (the marketing site's is #070707).
  useEffect(() => {
    const m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!m) return;
    const prev = m.content; m.content = "#0a0f16";
    return () => { m.content = prev; };
  }, []);

  // Mobile drawer: focus moves into it on open, Escape closes it, and focus
  // returns to the menu button — in both products.
  useEffect(() => {
    if (!menuOpen) {
      // Restore focus only after the page behind is no longer inert.
      if (focusPage.current) mainRef.current?.focus({ preventScroll: true });
      else if (wasOpen.current && window.matchMedia("(max-width: 1023px)").matches) menuBtnRef.current?.focus();
      focusPage.current = false;
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    railRef.current?.querySelector<HTMLElement>("nav a")?.focus();
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const h = (): void => setWide(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // In both products: Ctrl/⌘ K opens "Go to a page"; "[" folds or unfolds the rail.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); return; }
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
      if (e.key === "[" && window.matchMedia("(min-width: 1024px)").matches) { e.preventDefault(); setFoldedPref((f) => { writeFolded(!f); return !f; }); setTip(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // "g" then a digit jumps between Operations surfaces; "?" lists shortcuts.
  useEffect(() => {
    if (variant !== "operations") return;
    let armed = 0;
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.key === "Escape") { setMenuOpen(false); setShortcuts(false); return; }
      if (e.key === "?") { setShortcuts((s) => !s); return; }
      if (e.key === "g") { armed = Date.now(); return; }
      if (armed && Date.now() - armed < 1200) {
        const hit = items.find((n) => n.key === e.key);
        if (hit) { e.preventDefault(); nav(hit.to); }
        armed = 0;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [variant, items, nav]);

  const initials = session?.kind === "person"
    ? (session.subject.split("@")[0].split(/[._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("") || "?").toUpperCase()
    : (session?.subject ?? "?").replace(/^svc[:_]/, "").slice(0, 2).toUpperCase();

  return (
    <div className="sd-console flex h-full flex-col">
      <nav aria-label="Skip link"><a href="#sd-main" className="sd-skip">Skip to content</a></nav>
      {variant === "operations" && upgrade && (
        <UpgradeModal open reason="quota" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); setUpgrade(false); }} />
      )}

      {/* institutional top line — product identity and the real session window */}
      <header aria-label="Sovereign infrastructure" className="sd-noprint flex h-8 shrink-0 items-center gap-2.5 border-b border-sd-soft bg-[#0a0f16] px-4 text-[10.5px] font-bold uppercase tracking-[0.16em] text-sd-text3 sm:px-6">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sd-gold" />
        <span>Sovereign infrastructure</span><span aria-hidden className="text-sd-faint">/</span><span className="text-sd-text2">Dispatch</span>
        <span className="ml-auto hidden items-center gap-1.5 tracking-[0.1em] sm:flex" title="Bearer token held in memory only; expires automatically">
          <Icon.lock className="h-3 w-3" /> Tenant-scoped session{remaining && <span className="font-mono normal-case tracking-normal text-sd-text2"> · expires in {remaining.label}</span>}
        </span>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* mobile scrim */}
        {menuOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-[#05080daa] lg:hidden" onClick={() => setMenuOpen(false)} />}

        {/* rail */}
        <aside id="sd-rail" ref={railRef} aria-label={`${product.label} navigation`}
          className={cx("sd-noprint z-40 flex shrink-0 flex-col border-r border-sd-soft bg-[#0b121b] transition-[transform,width] duration-200",
            folded ? "w-[68px]" : "w-[256px]",
            "fixed inset-y-0 left-0 top-8 lg:static lg:translate-x-0", menuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full")}
          style={{ backgroundImage: "linear-gradient(180deg, rgba(214,178,106,0.07), transparent 170px), radial-gradient(120% 55% at 0% 100%, rgba(141,187,255,0.06), transparent 62%)" }}>
          <div className={cx("flex items-center", folded ? "flex-col gap-3 px-2 pb-3 pt-5" : "gap-3 px-4 pb-4 pt-5")}>
            <span aria-hidden className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sd-gold/50 bg-[radial-gradient(circle_at_30%_25%,rgba(214,178,106,0.18),transparent_65%)] font-serif text-[15px] font-semibold text-sd-text shadow-[0_0_24px_-8px_rgba(214,178,106,0.55)]">
              <span className="absolute inset-[3px] rounded-full border border-sd-gold/25" />SD
            </span>
            {!folded && <div className="min-w-0 leading-tight">
              <div className="text-[14.5px] font-semibold tracking-[-0.01em] text-sd-text">Sovereign <span className="font-normal text-sd-text2">Dispatch</span></div>
              <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-sd-gold/80">{product.label}</div>
            </div>}
            <button type="button" onClick={toggleFold} aria-label={folded ? "Expand the menu" : "Collapse the menu to its icons"} aria-keyshortcuts="[" title={folded ? "Expand ( [ )" : "Collapse ( [ )"}
              className={cx("hidden rounded-md p-1.5 text-sd-text3 ring-1 ring-white/10 transition hover:text-sd-gold hover:ring-sd-gold/40 lg:block", !folded && "ml-auto")}>
              <Icon.sidebar className="h-3.5 w-3.5" />
            </button>
            <button className="ml-auto rounded-md p-1 text-sd-text3 hover:bg-sd-hover hover:text-sd-text lg:hidden" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><Icon.close /></button>
          </div>

          {/* go to any page by name (Ctrl/⌘ K) */}
          <div className={folded ? "flex justify-center pb-2" : "px-3 pb-3"}>
            <button type="button" onClick={() => setPalette(true)} aria-keyshortcuts="Meta+K Control+K" aria-label={folded ? "Go to a page" : undefined} title={folded ? "Go to a page (Ctrl K)" : undefined}
              className={cx("flex items-center gap-2.5 rounded-md bg-black/25 text-left text-[12.5px] text-sd-text3 ring-1 ring-white/[0.08] transition hover:text-sd-text2 hover:ring-sd-gold/35", folded ? "p-2" : "w-full px-3 py-2")}>
              <Icon.search className="h-3.5 w-3.5" />
              {!folded && <><span className="flex-1">Go to a page</span><Kbd>{typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"}</Kbd></>}
            </button>
          </div>

          {/* tenant identity */}
          {!folded && (
            <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-lg border border-sd-line bg-sd-panel/70 px-3 py-2.5">
              <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-sd-accent/35 text-sd-accent"><Icon.building className="h-4 w-4" /></span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-sd-text3">Institution workspace</div>
                <div className="truncate text-[12px] text-sd-text">Private to your institution</div>
              </div>
            </div>
          )}

          <nav className={cx("sd-navscroll flex-1 overflow-y-auto pb-3", folded ? "px-2" : "px-2.5")}>
            {items.map((n, i) => {
              // A record file belongs to the register: keep "Official records" lit.
              const inFile = n.to === "/console/library" && pathname.startsWith("/console/documents/");
              const newGroup = n.group && n.group !== items[i - 1]?.group;
              return (
              <React.Fragment key={n.to}>
                {newGroup && (folded
                  ? <div aria-hidden className="mx-3 my-2.5 h-px bg-white/[0.07]" />
                  : <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-4 font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-sd-faint"><span aria-hidden className="h-px w-3 bg-sd-gold/40" />{n.group}</div>)}
                <NavLink to={n.to} end={n.end} aria-describedby={`sd-tip-${i}`} aria-label={folded ? taskName(n) : undefined}
                  onMouseEnter={(e) => showTip(n.to, e.currentTarget)} onMouseLeave={() => setTip(null)}
                  onFocus={(e) => showTip(n.to, e.currentTarget)} onBlur={() => setTip(null)}
                  className={({ isActive: a }) => { const isActive = a || inFile; return cx("group relative flex items-center gap-2.5 rounded-lg border text-[13px] font-medium transition-colors",
                    folded ? "justify-center px-0 py-2" : "px-2.5 py-[7px]",
                    isActive ? "border-sd-gold/25 bg-[linear-gradient(90deg,rgba(214,178,106,0.13),rgba(22,38,58,0.9))] text-sd-text" : "border-transparent text-sd-text2 hover:bg-sd-raised hover:text-sd-text"); }}>
                  {({ isActive: a }) => { const isActive = a || inFile; return (
                    <>
                      {isActive && <span aria-hidden className="absolute -left-[9px] top-1.5 bottom-1.5 w-[3px] rounded-r bg-sd-gold" />}
                      {n.icon ? React.createElement(Icon[n.icon], { className: cx("h-4 w-4 shrink-0", isActive ? "text-sd-gold" : "text-sd-text3 group-hover:text-sd-text2") }) : <span className="w-4" aria-hidden />}
                      {!folded && <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate">{taskName(n)}</span>
                        {taskName(n) !== n.label.replace(/ ↗$/, "") && <span className="block truncate text-[10.5px] font-normal text-sd-text3">{n.label}</span>}
                      </span>}
                      <span id={`sd-tip-${i}`} className="sr-only">{PAGE_GUIDE[n.to]?.summary}</span>
                      {!folded && variant === "operations" && n.key && <span aria-hidden className="ml-auto hidden shrink-0 font-mono text-[10px] text-sd-faint xl:inline">g {n.key}</span>}
                    </>
                  ); }}
                </NavLink>
              </React.Fragment>
              );
            })}
          </nav>
          {tip && PAGE_GUIDE[tip.to] && (
            <div aria-hidden className="pointer-events-none fixed z-50 w-72 rounded-lg border border-sd-line bg-[#111a26] p-3 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]" style={{ left: folded ? 76 : 264, top: Math.min(tip.top, window.innerHeight - 140) }}>
              <div className="text-[12.5px] font-semibold text-sd-text">{PAGE_GUIDE[tip.to]!.task}</div>
              <p className="mt-1 text-[12px] leading-snug text-sd-text2">{PAGE_GUIDE[tip.to]!.summary}</p>
            </div>
          )}

          {/* product switcher — only for principals with access to the other product */}
          {showSwitch && (
            <button onClick={() => nav(PRODUCT[other].home)} aria-label={folded ? `Switch to ${PRODUCT[other].label}` : undefined} title={folded ? `Switch to ${PRODUCT[other].label}` : undefined}
              className={cx("mb-2 flex items-center gap-2.5 rounded-lg border border-sd-line bg-sd-panel/70 text-left transition-colors hover:border-sd-gold/40", folded ? "mx-2 justify-center py-2" : "mx-3 px-3 py-2")}>
              <Icon.swap className="h-4 w-4 shrink-0 text-sd-text3" />
              {!folded && <><span className="min-w-0 leading-tight"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-sd-text3">Switch to</span><span className="block text-[12.5px] font-semibold text-sd-text">{PRODUCT[other].label}</span></span>
              <Icon.arrowRight className="ml-auto h-3.5 w-3.5 text-sd-text3" /></>}
            </button>
          )}
          {!folded && variant === "operations" && billing && (
            <div className="border-t border-sd-soft px-4 py-3">
              <QuotaMeter b={billing} />
              {!billing.canDownload && (
                <button onClick={() => setUpgrade(true)} className="mt-2 h-8 w-full rounded-lg bg-sd-accentbg text-[12px] font-semibold text-sd-accentink transition hover:bg-white">Upgrade</button>
              )}
            </div>
          )}
          {/* the account: initials in a gold ring, who is signed in and how */}
          <div className={cx("border-t border-sd-soft", folded ? "flex flex-col items-center gap-2 py-3" : "flex items-center gap-2.5 px-4 py-3")}>
            <span aria-hidden title={folded ? `${session?.subject ?? ""} · ${roleLine()}` : undefined}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sd-gold/10 font-mono text-[10.5px] font-semibold text-sd-text ring-1 ring-sd-gold/50">{initials}</span>
            {!folded && <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[12px] font-semibold text-sd-text" title={session?.subject}>{session?.subject}</div>
              <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.14em] text-sd-gold/75">{roleLine()}</div>
              <details className="group text-[11px] text-sd-text3">
                <summary className="cursor-pointer list-none hover:text-sd-text2">What you can do <span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span></summary>
                <ul className="mt-1 space-y-0.5 text-[11px] text-sd-text2">{session?.scopes.map((sc) => <li key={sc}>{scopeMeaning(sc)}</li>)}</ul>
                <details className="mt-1.5">
                  <summary className="cursor-pointer list-none text-[10.5px] hover:text-sd-text2">Technical details</summary>
                  <div className="mt-1 break-all font-mono text-[10px] text-sd-text3">Tenant {session?.tenantId || "—"}</div>
                  <ul className="mt-0.5 font-mono text-[10px] text-sd-text3">{session?.scopes.map((sc) => <li key={sc}>{sc}</li>)}</ul>
                </details>
              </details>
            </div>}
            {!folded && <Link to="/" aria-label="Sovereign Dispatch home" title="Home" className="rounded-md p-1.5 text-sd-text3 hover:bg-sd-hover hover:text-sd-text"><Icon.home /></Link>}
            <button onClick={() => { signOut(); nav("/"); }} aria-label="Sign out" title="Sign out" className="rounded-md p-1.5 text-sd-text3 hover:bg-sd-hover hover:text-sd-text"><Icon.logout /></button>
          </div>
        </aside>
        {palette && <PagePalette pages={reachable} onClose={() => setPalette(false)} onGo={(to) => { setPalette(false); nav(to); }} />}

        {/* main */}
        {/* While the mobile drawer is open the page behind it is inert (no stray focus). */}
        <div className="flex min-w-0 flex-1 flex-col" {...(menuOpen ? { inert: "" } : {})}>
          <section aria-label="Workspace bar" className="sd-noprint flex h-12 shrink-0 items-center gap-3 border-b border-sd-soft px-4 sm:px-6">
            <button ref={menuBtnRef} className="-ml-1 rounded-md p-1.5 text-sd-text2 hover:bg-sd-hover hover:text-sd-text lg:hidden" aria-label="Open navigation" aria-controls="sd-rail" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Icon.menu /></button>
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex items-center gap-2 text-[12.5px]">
                <li className="hidden text-sd-text3 sm:block">{product.label}</li>
                {crumb && <><li aria-hidden className="hidden text-sd-faint sm:block">/</li><li className="truncate font-semibold text-sd-text" aria-current="page">{crumb}</li></>}
              </ol>
            </nav>
            <span className="hidden font-mono text-[11.5px] text-sd-text3 md:block">{today}</span>
            {guide && guideHidden && (
              <button onClick={() => hideGuide(false)} className="hidden rounded-md px-2 py-1 text-[11.5px] text-sd-text3 hover:bg-sd-hover hover:text-sd-text sm:block">Page guide</button>
            )}
            {variant === "operations" && (
              <button onClick={() => setShortcuts((s) => !s)} className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] text-sd-text3 hover:bg-sd-hover hover:text-sd-text md:flex" aria-expanded={shortcuts} aria-controls="sd-shortcuts">
                <Icon.keyboard /> <Kbd>?</Kbd>
              </button>
            )}
          </section>

          {shortcuts && (
            <div id="sd-shortcuts" role="region" aria-label="Keyboard shortcuts" className="sd-fade border-b border-sd-soft bg-sd-panel px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-sd-text2">
                {items.filter((n) => n.key).map((n) => <span key={n.to} className="flex items-center gap-1.5"><Kbd>g</Kbd><Kbd>{n.key}</Kbd>{taskName(n)}</span>)}
                <span className="flex items-center gap-1.5"><Kbd>/</Kbd>Focus search</span>
                <span className="flex items-center gap-1.5"><Kbd>j</Kbd><Kbd>k</Kbd>Move in queue / register</span>
                <span className="flex items-center gap-1.5"><Kbd>o</Kbd>Open selected record (review)</span>
                <span className="flex items-center gap-1.5"><Kbd>Esc</Kbd>Close</span>
                <button onClick={() => setShortcuts(false)} className="ml-auto text-[12px] font-semibold text-sd-accent hover:underline">Close</button>
              </div>
            </div>
          )}

          {guide && !guideHidden && (
            <section aria-label="Page guide" className="sd-noprint flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-sd-soft bg-[#0d1520] px-4 py-2 text-[12.5px] sm:px-6">
              <p className="min-w-0 flex-1 text-sd-text2"><span className="font-semibold text-sd-text">This page:</span> {guide.summary}</p>
              {nextPage && PAGE_GUIDE[nextPage] && (
                <Link to={nextPage} className="font-semibold text-sd-accent hover:underline">Usually next: {PAGE_GUIDE[nextPage]!.task} →</Link>
              )}
              <button onClick={() => hideGuide(true)} className="text-[12px] text-sd-text3 hover:text-sd-text">Hide</button>
            </section>
          )}

          {/* announces the destination after client-side navigation */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">{crumb ? `${crumb} — ${product.label}` : product.label}</div>

          {remaining && remaining.minutes <= 2 && (
            <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-sd-warn/40 bg-[#2a2314] px-4 py-2 text-[12.5px] text-sd-warn sm:px-6">
              <Icon.clock className="h-4 w-4 shrink-0" />
              <span className="font-semibold">Your session ends in {remaining.minutes <= 0 ? "under a minute" : `${remaining.minutes} min`}.</span>
              <span className="text-sd-text2">The token is held in memory and cannot be extended; unsaved authoring will be lost. Submit or copy your work, then sign in again.</span>
            </div>
          )}

          <main id="sd-main" ref={mainRef} tabIndex={-1} aria-label={crumb || product.label} className="relative min-h-0 flex-1 overflow-y-auto outline-none">
            <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">{children}</div>
            <footer className="sd-noprint mx-auto flex w-full max-w-[1480px] flex-wrap justify-between gap-2 border-t border-sd-soft px-4 py-4 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sd-faint sm:px-6 lg:px-8">
              <span><span className="text-sd-text3">Sovereign Dispatch</span> · Institutional record infrastructure</span>
              <span>Controlled access · append-only evidence</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ConsoleShell;
