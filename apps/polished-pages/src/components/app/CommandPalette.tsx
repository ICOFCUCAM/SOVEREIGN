import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DASHBOARD_NAV, ACCOUNT_NAV, LIBRARY_NAV } from "@/lib/tools";
import { WORKFLOWS } from "@/lib/nav";
import { LogOut, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startUpgrade } from "@/lib/session";

// Global command palette (⌘K / Ctrl-K). Every tool and account action is
// reachable from one keystroke — the backbone of the studio's discoverability.
const CommandPalette = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const go = (path: string) => { onOpenChange(false); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search every tool and action…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Workspace">
          <CommandItem value="dashboard home" onSelect={() => go(DASHBOARD_NAV.path)}>
            <DASHBOARD_NAV.icon className="mr-2 h-4 w-4" /> {DASHBOARD_NAV.name}
          </CommandItem>
          <CommandItem value="library saved documents" onSelect={() => go(LIBRARY_NAV.path)}>
            <LIBRARY_NAV.icon className="mr-2 h-4 w-4" /> {LIBRARY_NAV.name}
          </CommandItem>
          <CommandItem value="account billing settings plan" onSelect={() => go(ACCOUNT_NAV.path)}>
            <ACCOUNT_NAV.icon className="mr-2 h-4 w-4" /> {ACCOUNT_NAV.name}
          </CommandItem>
        </CommandGroup>

        {/* One group per lifecycle verb, so the whole platform is reachable
            from a single keystroke and organised the same way as the nav. */}
        {WORKFLOWS.map((w) => {
          const items = w.columns.flatMap((c) => c.items);
          return (
            <CommandGroup key={w.id} heading={w.label}>
              {items.map((it) => (
                <CommandItem key={`${w.id}-${it.path}-${it.label}`} value={`${w.label} ${it.label} ${it.desc ?? ""}`} onSelect={() => go(it.path)}>
                  <w.icon className="mr-2 h-4 w-4 opacity-70" /> {it.label}
                  {it.desc && <span className="ml-auto text-xs text-muted-foreground">{it.desc}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}

        <CommandGroup heading="Actions">
          <CommandItem value="upgrade pro billing plan pricing" onSelect={() => { onOpenChange(false); startUpgrade().catch(() => {}); }}>
            <Sparkles className="mr-2 h-4 w-4" /> Upgrade your plan
          </CommandItem>
          <CommandItem value="pricing plans compare" onSelect={() => go("/pricing")}>
            <ArrowRight className="mr-2 h-4 w-4" /> Compare plans
          </CommandItem>
          <CommandItem value="sign out logout" onSelect={() => { onOpenChange(false); supabase.auth.signOut(); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
