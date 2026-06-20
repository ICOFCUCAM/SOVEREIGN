import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Search, ChevronDown, LogOut, Settings, LayoutDashboard, Crown, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { fetchPlanStatus, startUpgrade, type PlanStatus } from "@/lib/session";
import { TOOLS, BRAND, DASHBOARD_NAV, ACCOUNT_NAV, LIBRARY_NAV } from "@/lib/tools";
import CommandPalette from "@/components/app/CommandPalette";

// The persistent studio chrome: one global navigation that ties every tool
// together, an account menu with live plan/usage, and the ⌘K command palette.
// Rendered once (by AuthGate) around the whole signed-in app.
const AppShell = ({ email, children }: { email: string; children: ReactNode }) => {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const { pathname } = useLocation();

  useEffect(() => { fetchPlanStatus().then(setStatus); }, []);

  const isPro = status?.plan === "pro";
  const usageLabel = status
    ? (isPro ? "Pro · unlimited" : `${status.used}/${status.lim} this month`)
    : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to={DASHBOARD_NAV.path} className="flex shrink-0 items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-serif text-base font-bold tracking-tight">{BRAND}</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {TOOLS.map((t) => {
              const active = pathname === t.path;
              return (
                <Link
                  key={t.id}
                  to={t.path}
                  className={`relative rounded-md px-3 py-1.5 text-sm font-sans transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
                >
                  {t.short}
                  {t.badge === "New" && <span className="ml-1.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold align-middle">New</span>}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted sm:flex"
              aria-label="Open command palette"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="rounded border border-border bg-background px-1.5 font-sans text-[10px]">⌘K</kbd>
            </button>

            {!isPro && status && (
              <Button size="sm" variant="hero" className="hidden sm:inline-flex" onClick={() => startUpgrade().catch(() => {})}>
                <Crown className="mr-1 h-3.5 w-3.5" /> Upgrade
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-muted/60">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(email[0] || "?").toUpperCase()}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="truncate text-sm font-medium">{email}</div>
                  {usageLabel && <div className="text-xs text-muted-foreground">{usageLabel}</div>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to={DASHBOARD_NAV.path}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={LIBRARY_NAV.path}><Library className="mr-2 h-4 w-4" /> Library</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={ACCOUNT_NAV.path}><Settings className="mr-2 h-4 w-4" /> Account & billing</Link></DropdownMenuItem>
                {!isPro && (
                  <DropdownMenuItem onClick={() => startUpgrade().catch(() => {})}><Crown className="mr-2 h-4 w-4" /> Upgrade to Pro</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <main className="pt-14">{children}</main>
    </div>
  );
};

export default AppShell;
