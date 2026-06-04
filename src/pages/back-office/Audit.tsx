import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { listAuditLog, type BoAuditEntry, type BoProfile, canSeeAudit, BO_ROLES } from "@/lib/backOffice";

const Audit: React.FC = () => {
  const { profile } = useOutletContext<{ profile: BoProfile }>();
  const [entries, setEntries] = useState<BoAuditEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listAuditLog(500).then(setEntries).catch(() => setEntries([]));
  }, []);

  if (!canSeeAudit(profile.role)) {
    return (
      <div className="p-8">
        <div className="max-w-md rounded-md border border-white/10 bg-black/40 p-6 text-sm text-white/65">
          Audit log access restricted to superadmin and auditor.
        </div>
      </div>
    );
  }

  const tokens = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = tokens.length === 0 ? entries : entries.filter((e) => {
    const hay = [e.actor_email, e.actor_role, e.action, e.entity_type, e.entity_id].filter(Boolean).join(" ").toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Audit log</div>
        <h1 className="font-bold text-3xl mt-2">{entries.length} events</h1>
        <p className="mt-2 text-sm text-white/55">Append-only. Every mutation on accounts, periods, journal entries, user profiles, and the company record is recorded.</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
        placeholder="filter · actor email · action · entity"
      />

      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3">When</th>
              <th className="px-5 py-3">Actor</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Entity</th>
              <th className="px-5 py-3">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const roleLabel = e.actor_role ? (BO_ROLES.find((r) => r.value === e.actor_role)?.label ?? e.actor_role) : "—";
              return (
                <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-2.5 text-[12px] text-white/55 font-mono">{new Date(e.at).toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-white/85 text-[12px]">{e.actor_email ?? "system"}</td>
                  <td className="px-5 py-2.5 text-cyan-300 text-[11px] uppercase tracking-wide">{roleLabel}</td>
                  <td className="px-5 py-2.5 font-mono text-white text-[12px]">{e.action}</td>
                  <td className="px-5 py-2.5 text-white/65 text-[12px]">{e.entity_type}</td>
                  <td className="px-5 py-2.5 text-white/35 text-[10px] font-mono">{e.entity_id ?? "—"}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-white/40">No audit events.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Audit;
