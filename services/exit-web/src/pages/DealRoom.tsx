import React from "react";
import { Card, Kpi, SectionHeader } from "../lib/ui";
import BankerTake from "../components/BankerTake";
import { dealRoomActivity, documentAttention, fmtDuration, type BuyerActivity } from "../lib/deal-room-activity";

// Live Deal Room — not storage, a command center. It shows who's in the room,
// what they viewed and downloaded, which sensitive documents drew real dwell
// (concern signals), and which buyers are most engaged — so the founder calls
// the buyer who's about to move, not the one who went quiet.

const STATUS_STYLE: Record<string, string> = {
  "Likely moving to LOI": "bg-deal-600/25 text-deal-200 ring-deal-400/50",
  "Actively evaluating":  "bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/40",
  "Working the package":  "bg-loi-500/15 text-loi-300 ring-loi-400/40",
  "Early review":         "bg-white/5 text-white/55 ring-white/15",
  "Cooling":              "bg-white/5 text-white/45 ring-white/15",
};

const DealRoom: React.FC = () => {
  const activity = dealRoomActivity(6);
  const docs = documentAttention(activity);
  const top = activity[0];
  const totalMinutes = activity.reduce((s, a) => s + a.timeMinutes, 0);
  const totalDownloads = activity.reduce((s, a) => s + a.downloads, 0);
  const concernDocs = docs.filter((d) => d.concernViews > 0);

  return (
    <div>
      <SectionHeader
        kicker="Diligence · Buyer activity"
        title="Live Deal Room"
        description="Every buyer's session, live: who viewed what, who downloaded what, which documents drew concern, and which buyers are most engaged. The deal room as a command center, not a file store."
      />

      {top && (
        <BankerTake
          next={<>Call <span className="text-white">{top.buyerName}</span> now — {fmtDuration(top.timeMinutes)} in the room and {top.interestScore}% interest. {top.status}.</>}
          stake={<>The hottest buyer is <span className="font-mono font-bold text-deal-300">{top.interestScore}%</span> engaged across {top.viewed.length} documents.</>}
          inaction={<>Engagement decays fast — a buyer this deep who hears nothing back cools within days.</>}
          buyer={<><span className="text-white">{top.buyerName}</span> — {top.status.toLowerCase()}, {top.downloads} downloads, {top.concerns.length} concern signal{top.concerns.length === 1 ? "" : "s"}.</>}
          automate={<>ExitOS tracks every view, download and dwell, scores intent and flags the documents drawing concern.</>}
          impact={<>{top.interestScore}%</>}
          cta={{ label: "Open the negotiator", to: "/console/negotiator" }}
        />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Buyers in the room" value={String(activity.length)} sub="with NDA + access" accent="#34d399" />
        <Kpi label="Total time in room" value={fmtDuration(totalMinutes)} sub="across all buyers" />
        <Kpi label="Documents downloaded" value={String(totalDownloads)} sub="this week" />
        <Kpi label="Hottest buyer" value={top ? `${top.interestScore}%` : "—"} sub={top?.buyerName ?? ""} accent="#34d399" />
      </div>

      {/* ── Buyer engagement ─────────────────────────────────────── */}
      <h2 className="mt-10 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Buyer activity · ranked by intent</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {activity.map((a, i) => <BuyerCard key={a.buyerName} a={a} rank={i + 1} />)}
      </div>

      {/* ── Document attention ───────────────────────────────────── */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Documents drawing attention</div>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="py-2">Document</th>
                <th className="py-2 text-right">Views</th>
                <th className="py-2 text-right">Downloads</th>
                <th className="py-2 text-right">Concern dwell</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.label} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 text-white/85">
                    {d.label}
                    {d.concern && <span className="ml-2 rounded bg-loi-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-loi-300">sensitive</span>}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-white/80">{d.views}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-white/80">{d.downloads}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums" style={{ color: d.concernViews > 0 ? "#f87171" : "rgba(255,255,255,0.4)" }}>{d.concernViews || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red-300">Causing concern</div>
          <p className="mt-1 text-[11px] text-white/45">Sensitive documents buyers are dwelling on — get ahead of the question.</p>
          {concernDocs.length === 0 ? (
            <p className="mt-4 text-sm text-white/55">No concentrated dwell on sensitive documents yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {concernDocs.map((d) => (
                <li key={d.label} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <div>
                    <div className="text-[13px] font-semibold text-white">{d.label}</div>
                    <div className="text-[11px] text-white/45">{d.concernViews} buyer{d.concernViews === 1 ? "" : "s"} dwelling — prep the rebuttal in the CIM.</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

const BuyerCard: React.FC<{ a: BuyerActivity; rank: number }> = ({ a, rank }) => {
  const scoreColor = a.interestScore >= 85 ? "#34d399" : a.interestScore >= 60 ? "#fbbf24" : "#94a3b8";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 font-mono text-[11px] font-bold text-white/60 ring-1 ring-white/15">{rank}</span>
          <div>
            <div className="text-sm font-bold text-white">{a.buyerName}</div>
            <div className="text-[11px] text-white/40">{a.buyerType.replace(/_/g, " ")} · active {a.lastActive}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Interest</div>
          <div className="font-mono text-2xl font-bold" style={{ color: scoreColor }}>{a.interestScore}%</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-white/60">
        <span><span className="font-mono text-white/85">{fmtDuration(a.timeMinutes)}</span> in room</span>
        <span><span className="font-mono text-white/85">{a.viewed.length}</span> viewed</span>
        <span><span className="font-mono text-white/85">{a.downloads}</span> downloaded</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {a.viewed.map((d) => (
          <span key={d.key} className={`rounded px-2 py-0.5 text-[10px] font-medium ring-1 ${d.concern && d.dwellMin >= 8 ? "bg-red-500/10 text-red-300 ring-red-400/30" : "bg-white/5 text-white/60 ring-white/10"}`}>
            {d.label}{d.downloaded ? " ↓" : ""}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${STATUS_STYLE[a.status] ?? "bg-white/5 text-white/55 ring-white/15"}`}>{a.status}</span>
        {a.concerns.length > 0 && (
          <span className="text-[11px] text-red-300/80">{a.concerns.length} concern signal{a.concerns.length === 1 ? "" : "s"}</span>
        )}
      </div>
    </Card>
  );
};

export default DealRoom;
