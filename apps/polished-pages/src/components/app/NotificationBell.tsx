import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CreditCard, FileText, Store, TrendingUp, Sparkles, X, type LucideIcon } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { fetchPlanStatus, type PlanStatus } from "@/lib/session";
import { listDocuments, type DocSummary } from "@/lib/documents";
import { buildAlerts, unseenCount, markAlertsSeen, getDismissed, dismissAlert, type Alert, type AlertKind } from "@/lib/notifications";

const ICON: Record<AlertKind, LucideIcon> = {
  usage: CreditCard, draft: FileText, publish: Store, growth: TrendingUp, activity: Sparkles,
};

const NotificationBell = () => {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>(() => getDismissed());

  const drop = (id: string) => { dismissAlert(id); setDismissed((d) => [...d, id]); };

  useEffect(() => {
    const refresh = () => {
      fetchPlanStatus().then(setStatus).catch(() => {});
      listDocuments().then(setDocs).catch(() => setDocs([]));
    };
    refresh();
    // Re-check when the user returns to the tab so alerts reflect current state.
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    const a = buildAlerts(status, docs).filter((x) => !dismissed.includes(x.id));
    setAlerts(a);
    setUnread(unseenCount(a));
  }, [status, docs, dismissed]);

  const onOpenChange = (open: boolean) => {
    if (open && alerts.length > 0) { markAlertsSeen(alerts); setUnread(0); }
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="relative rounded-md p-1.5 text-muted-foreground transition-premium hover:bg-muted hover:text-foreground" aria-label={`Alerts${unread > 0 ? ` (${unread} new)` : ""}`}>
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unread > 9 ? "9+" : unread}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-sans">Alerts &amp; activity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground font-sans">You're all caught up.</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {alerts.map((a) => {
              const Icon = ICON[a.kind];
              const body = (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-3.5 w-3.5 text-primary" /></span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium font-sans">{a.title}</div>
                    {a.body && <div className="text-xs text-muted-foreground font-sans">{a.body}</div>}
                  </div>
                </div>
              );
              return (
                <div key={a.id} className="group/alert flex items-start gap-1 rounded-md px-3 py-2 hover:bg-muted">
                  {a.to ? <Link to={a.to} className="min-w-0 flex-1">{body}</Link> : <div className="min-w-0 flex-1">{body}</div>}
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); drop(a.id); }} aria-label="Dismiss" className="shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover/alert:opacity-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
