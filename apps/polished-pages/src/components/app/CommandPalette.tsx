import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { TOOLS, DASHBOARD_NAV, ACCOUNT_NAV, LIBRARY_NAV } from "@/lib/tools";
import { LogOut, Sparkles } from "lucide-react";
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
      <CommandInput placeholder="Search tools and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => go(DASHBOARD_NAV.path)}>
            <DASHBOARD_NAV.icon className="mr-2 h-4 w-4" /> {DASHBOARD_NAV.name}
          </CommandItem>
          {TOOLS.map((t) => (
            <CommandItem key={t.id} value={`${t.name} ${t.keywords.join(" ")}`} onSelect={() => go(t.path)}>
              <t.icon className="mr-2 h-4 w-4" /> {t.name}
            </CommandItem>
          ))}
          <CommandItem value="library saved documents" onSelect={() => go(LIBRARY_NAV.path)}>
            <LIBRARY_NAV.icon className="mr-2 h-4 w-4" /> {LIBRARY_NAV.name}
          </CommandItem>
          <CommandItem onSelect={() => go(ACCOUNT_NAV.path)}>
            <ACCOUNT_NAV.icon className="mr-2 h-4 w-4" /> {ACCOUNT_NAV.name}
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Quick actions">
          {TOOLS.map((t) => (
            <CommandItem key={`a-${t.id}`} value={`${t.action} ${t.keywords.join(" ")}`} onSelect={() => go(t.path)}>
              <t.icon className="mr-2 h-4 w-4" /> {t.action}
            </CommandItem>
          ))}
          <CommandItem value="upgrade pro billing plan" onSelect={() => { onOpenChange(false); startUpgrade().catch(() => {}); }}>
            <Sparkles className="mr-2 h-4 w-4" /> Upgrade to Pro
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
