import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useBilling, QuotaMeter, UpgradeModal } from "../lib/upsell";
import { Icon } from "./console/icons";
import { Kbd, cx } from "./console/ds";

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

// Administration is an institutional governance product organised by operational
// domain — Identity (who holds authority), Governance (how records are governed),
// Compliance (can we prove it) — not a flat list of database tables.
const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Posture", end: true, icon: "shield" },
  { to: "/admin/setup", label: "Establish Institution", scope: "dispatch:admin", group: "Identity" },
  { to: "/admin/authority", label: "Authority Directory", scope: "dispatch:admin", group: "Identity" },
  { to: "/admin/access", label: "API Access", scope: "dispatch:admin", group: "Platform" },
  { to: "/admin/publishing", label: "Publishing Platform", scope: "dispatch:admin", group: "Platform" },
  { to: "/admin/governance", label: "Policy", scope: "dispatch:admin", group: "Governance" },
  { to: "/admin/monitor", label: "Oversight", scope: "dispatch:read", group: "Governance" },
  { to: "/admin/compliance", label: "Audit & Compliance", scope: "dispatch:read", group: "Compliance" },
  { to: "/admin/intelligence", label: "Intelligence", scope: "dispatch:read", group: "Compliance" },
  { to: "/admin/trust", label: "Trust", scope: "dispatch:read", group: "Sovereignty" },
  { to: "/admin/deployment", label: "Deployment", group: "Sovereignty" },
  { to: "/admin/sovereignty", label: "Data Sovereignty", group: "Sovereignty" },
  { to: "/admin/integrations", label: "Integrations", group: "Sovereignty" },
  { to: "/admin/resilience", label: "Operational Resilience", group: "Sovereignty" },
  { to: "/admin/evidence", label: "Evaluation Package", scope: "dispatch:read", group: "Sovereignty" },
  { to: "/evaluate", label: "Executive Evaluation ↗", scope: "dispatch:read", group: "Sovereignty" },
  { to: "/admin/intake", label: "Direct DDM Intake", scope: "dispatch:render", group: "Platform" },
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

const ConsoleShell: React.FC<{ children: React.ReactNode; variant?: ConsoleVariant }> = ({ children, variant = "operations" }) => {
  const { session, signOut, has } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { billing, setBilling } = useBilling();
  const [upgrade, setUpgrade] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const product = PRODUCT[variant];
  const items = product.nav.filter((n) => !n.scope || has(n.scope));
  // The switcher only appears for principals who can actually use the other
  // product. Administration is gated on dispatch:admin; Operations on any
  // operating scope. A pure operator never even learns Administration exists.
  const canAdmin = has("dispatch:admin");
  const other = variant === "operations" ? "administration" : "operations";
  const showSwitch = other === "administration" ? canAdmin : true;
  const crumb = crumbFor(pathname, product.nav);
  const remaining = useSessionClock(session?.expiresAt);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  // Close the mobile drawer on navigation; move focus to the page for screen readers.
  useEffect(() => { setMenuOpen(false); mainRef.current?.focus({ preventScroll: true }); mainRef.current?.scrollTo(0, 0); }, [pathname]);

  // Mobile browser chrome matches the console ground (the marketing site's is #070707).
  useEffect(() => {
    const m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!m) return;
    const prev = m.content; m.content = "#0a0f16";
    return () => { m.content = prev; };
  }, []);

  // Mobile drawer: focus moves into it on open, Escape closes it, and focus
  // returns to the menu button — in both products.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!menuOpen) {
      // Restore focus only after the page behind is no longer inert.
      if (wasOpen.current && window.matchMedia("(max-width: 1023px)").matches) menuBtnRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    railRef.current?.querySelector<HTMLElement>("nav a")?.focus();
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [menuOpen]);

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

  const initials = (session?.subject ?? "?").replace(/^svc:/, "").slice(0, 2).toUpperCase();

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
          className={cx("sd-noprint z-40 flex w-[248px] shrink-0 flex-col border-r border-sd-soft bg-[#0c131d]",
            "fixed inset-y-0 left-0 top-8 transition-transform lg:static lg:translate-x-0", menuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full")}>
          <div className="flex items-center gap-3 px-4 pb-4 pt-5">
            <span aria-hidden className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sd-gold/45 font-serif text-[15px] font-semibold text-sd-text">
              <span className="absolute inset-[3px] rounded-full border border-sd-gold/25" />SD
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-[14.5px] font-semibold tracking-[-0.01em] text-sd-text">Sovereign <span className="font-normal text-sd-text2">Dispatch</span></div>
              <div className="mt-0.5 text-[11px] text-sd-text3">{product.label} · {product.tag}</div>
            </div>
            <button className="ml-auto rounded-md p-1 text-sd-text3 hover:bg-sd-hover hover:text-sd-text lg:hidden" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><Icon.close /></button>
          </div>

          {/* tenant identity — the real tenant reference from the session */}
          <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-lg border border-sd-line bg-sd-panel px-3 py-2.5">
            <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-sd-accent/35 text-sd-accent"><Icon.building className="h-4 w-4" /></span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-sd-text3">Tenant</div>
              <div className="truncate font-mono text-[12px] text-sd-text" title={session?.tenantId}>{session?.tenantId ? `${session.tenantId.slice(0, 8)}…` : "—"}</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2.5 pb-3">
            {items.map((n, i) => {
              // A record file belongs to the register: keep "Official records" lit.
              const inFile = n.to === "/console/library" && pathname.startsWith("/console/documents/");
              return (
              <React.Fragment key={n.to}>
                {n.group && n.group !== items[i - 1]?.group && (
                  <div className="px-2.5 pb-1 pt-4 text-[10.5px] font-bold uppercase tracking-[0.16em] text-sd-faint">{n.group}</div>
                )}
                <NavLink to={n.to} end={n.end}
                  className={({ isActive: a }) => { const isActive = a || inFile; return cx("group flex items-center gap-2.5 rounded-lg border px-2.5 py-[7px] text-[13px] font-medium transition-colors",
                    isActive ? "border-sd-accent/30 bg-[#16263a] text-sd-text" : "border-transparent text-sd-text2 hover:bg-sd-raised hover:text-sd-text"); }}>
                  {({ isActive: a }) => { const isActive = a || inFile; return (
                    <>
                      {n.icon ? React.createElement(Icon[n.icon], { className: cx("h-4 w-4 shrink-0", isActive ? "text-sd-accent" : "text-sd-text3 group-hover:text-sd-text2") }) : <span className="w-4" aria-hidden />}
                      <span className="truncate">{n.label}</span>
                      {variant === "operations" && n.key && <span aria-hidden className="ml-auto hidden font-mono text-[10px] text-sd-faint xl:inline">g {n.key}</span>}
                    </>
                  ); }}
                </NavLink>
              </React.Fragment>
              );
            })}
          </nav>

          {/* product switcher — only for principals with access to the other product */}
          {showSwitch && (
            <button onClick={() => nav(PRODUCT[other].home)}
              className="mx-3 mb-2 flex items-center gap-2.5 rounded-lg border border-sd-line bg-sd-panel px-3 py-2 text-left transition-colors hover:border-sd-accent/40">
              <Icon.swap className="h-4 w-4 shrink-0 text-sd-text3" />
              <span className="min-w-0 leading-tight"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-sd-text3">Switch to</span><span className="block text-[12.5px] font-semibold text-sd-text">{PRODUCT[other].label}</span></span>
              <Icon.arrowRight className="ml-auto h-3.5 w-3.5 text-sd-text3" />
            </button>
          )}
          {variant === "operations" && billing && (
            <div className="border-t border-sd-soft px-4 py-3">
              <QuotaMeter b={billing} />
              {!billing.canDownload && (
                <button onClick={() => setUpgrade(true)} className="mt-2 h-8 w-full rounded-lg bg-sd-accentbg text-[12px] font-semibold text-sd-accentink transition hover:bg-white">Upgrade</button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2.5 border-t border-sd-soft px-4 py-3">
            <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sd-hover text-[11px] font-bold text-sd-text2">{initials}</span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[12px] font-semibold text-sd-text" title={session?.subject}>{session?.subject}</div>
              <details className="group text-[11px] text-sd-text3">
                <summary className="cursor-pointer list-none hover:text-sd-text2">{session?.scopes.length ?? 0} permission{session?.scopes.length === 1 ? "" : "s"} granted <span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span></summary>
                <ul className="mt-1 space-y-0.5 font-mono text-[10.5px] text-sd-text2">{session?.scopes.map((sc) => <li key={sc}>{sc}</li>)}</ul>
              </details>
            </div>
            <Link to="/" aria-label="Sovereign Dispatch home" title="Home" className="rounded-md p-1.5 text-sd-text3 hover:bg-sd-hover hover:text-sd-text"><Icon.home /></Link>
            <button onClick={() => { signOut(); nav("/"); }} aria-label="Sign out" title="Sign out" className="rounded-md p-1.5 text-sd-text3 hover:bg-sd-hover hover:text-sd-text"><Icon.logout /></button>
          </div>
        </aside>

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
            {variant === "operations" && (
              <button onClick={() => setShortcuts((s) => !s)} className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] text-sd-text3 hover:bg-sd-hover hover:text-sd-text md:flex" aria-expanded={shortcuts} aria-controls="sd-shortcuts">
                <Icon.keyboard /> <Kbd>?</Kbd>
              </button>
            )}
          </section>

          {shortcuts && (
            <div id="sd-shortcuts" role="region" aria-label="Keyboard shortcuts" className="sd-fade border-b border-sd-soft bg-sd-panel px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-sd-text2">
                {items.filter((n) => n.key).map((n) => <span key={n.to} className="flex items-center gap-1.5"><Kbd>g</Kbd><Kbd>{n.key}</Kbd>{n.label}</span>)}
                <span className="flex items-center gap-1.5"><Kbd>/</Kbd>Focus search</span>
                <span className="flex items-center gap-1.5"><Kbd>j</Kbd><Kbd>k</Kbd>Move in queue / register</span>
                <span className="flex items-center gap-1.5"><Kbd>o</Kbd>Open selected record (review)</span>
                <span className="flex items-center gap-1.5"><Kbd>Esc</Kbd>Close</span>
                <button onClick={() => setShortcuts(false)} className="ml-auto text-[12px] font-semibold text-sd-accent hover:underline">Close</button>
              </div>
            </div>
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

          <main id="sd-main" ref={mainRef} tabIndex={-1} aria-label={crumb || product.label} className="min-h-0 flex-1 overflow-y-auto outline-none">
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
