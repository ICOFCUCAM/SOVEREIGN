import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CreditCard, FileText, Store, TrendingUp, Sparkles, type LucideIcon } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { fetchPlanStatus, type PlanStatus } from "@/lib/session";
import { listDocuments, type DocSummary } from "@/lib/documents";
import { buildAlerts, unseenCount, markAlertsSeen, type Alert, type AlertKind } from "@/lib/notifications";

const ICON: Record<AlertKind, LucideIcon> = {
  usage: CreditCard, draft: FileText, publish: Store, growth: TrendingUp, activity: Sparkles,
};

const NotificationBell = () => {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetchPlanStatus().then(setStatus).catch(() => {});
    listDocuments().then(setDocs).catch(() => setDocs([]));
  }, []);

  useEffect(() => {
    const a = buildAlerts(status, docs);
    setAlerts(a);
    setUnread(unseenCount(a));
  }, [status, docs]);

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
              const inner = (
                <div className="flex items-start gap-2.5 px-3 py-2">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-3.5 w-3.5 text-primary" /></span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium font-sans">{a.title}</div>
                    {a.body && <div className="text-xs text-muted-foreground font-sans">{a.body}</div>}
                  </div>
                </div>
              );
              return a.to
                ? <Link key={a.id} to={a.to} className="block rounded-md hover:bg-muted">{inner}</Link>
                : <div key={a.id} className="rounded-md">{inner}</div>;
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
