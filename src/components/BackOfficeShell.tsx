import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyBoProfile, type BoProfile, BO_ROLES, canSeeAudit, canManageUsers } from "@/lib/backOffice";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Users, BookOpenText, NotebookPen, LineChart, ShieldCheck, LogOut, Lock } from "lucide-react";

// Back-office shell. Three-zone layout: header (org + user), left rail
// (role-aware nav), main content (Outlet). Independently themed from
// the public marketing site — black/cyan, audit-grade chrome.

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  visible?: (p: BoProfile) => boolean;
}

const NAV: NavItem[] = [
  { to: "/back-office",          label: "Dashboard",     icon: <LayoutDashboard size={16} /> },
  { to: "/back-office/users",    label: "Officers",      icon: <Users size={16} />,         visible: (p) => canManageUsers(p.role) },
  { to: "/back-office/accounts", label: "Chart of accounts", icon: <BookOpenText size={16} /> },
  { to: "/back-office/journal",  label: "Journal entries",   icon: <NotebookPen size={16} /> },
  { to: "/back-office/reports",  label: "Financial reports", icon: <LineChart size={16} /> },
  { to: "/back-office/audit",    label: "Audit log",     icon: <ShieldCheck size={16} />,   visible: (p) => canSeeAudit(p.role) },
];

const BackOfficeShell: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [profile, setProfile] = useState<BoProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav("/back-office/login", { replace: true, state: { from: loc.pathname } }); return; }
    setLoading(true);
    fetchMyBoProfile(user.id)
      .then((p) => setProfile(p))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user, authLoading, nav, loc.pathname]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm text-white/55">Loading back office…</div>
      </div>
    );
  }

  if (!profile || profile.status !== "active") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <Lock className="mx-auto text-cyan-400" size={36} />
          <h1 className="mt-6 font-bold text-2xl">Back office access denied</h1>
          <p className="mt-3 text-sm text-white/55">
            {profile ? `Your profile is ${profile.status}.` : "Your account has no back-office profile."} Contact a superadmin to provision access.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); nav("/back-office/login", { replace: true }); }}
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const items = NAV.filter((n) => !n.visible || n.visible(profile));
  const roleLabel = BO_ROLES.find((r) => r.value === profile.role)?.label ?? profile.role;

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <header className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <Link to="/back-office" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-cyan-400/15 ring-1 ring-cyan-400/30 flex items-center justify-center font-mono text-[10px] text-cyan-300 font-bold">BO</div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-sm tracking-tight">SOVEREIGN</span>
              <span className="text-cyan-400/60 text-[9px] tracking-[0.24em] font-mono">BACK OFFICE</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[12px] text-white font-medium">{profile.full_name}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/70">{roleLabel}</div>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); nav("/back-office/login", { replace: true }); }}
              className="rounded-md border border-white/10 p-2 text-white/70 hover:bg-white/5"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 shrink-0 border-r border-white/10 bg-black/40 min-h-[calc(100vh-57px)] p-4">
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/back-office"}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition ${
                    isActive
                      ? "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/30"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-md border border-white/5 bg-white/[0.02] p-3 text-[11px] text-white/45">
            <div className="font-semibold uppercase tracking-[0.16em] text-white/55">Phase 1</div>
            <p className="mt-1.5 leading-relaxed">
              Ledger foundation only. Country-specific tax forms (US 1120 / UK CT600 / FR liasse / NO RF-1167) and payment-processor integrations land in subsequent phases.
            </p>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  );
};

export default BackOfficeShell;
