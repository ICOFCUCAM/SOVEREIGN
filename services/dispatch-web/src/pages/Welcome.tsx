import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useInstitutionConfig, computeReadiness, type StepId } from "../lib/readiness";
import { useBilling, QuotaMeter, UpgradeModal } from "../lib/upsell";
import { Icon } from "../components/console/icons";

// Welcome — where a new institution starts. Six steps, each opening the page that does the work and each
// ticked from the institution's live configuration. The first three are the essentials: until they are in
// place, the administrator's first sign-in of a session opens here (lib/readiness). The guided set-up
// (/admin/setup) remains the place where structure, offices and people are entered; this page is the map.

interface Card { id: StepId; title: string; why: string; icon: keyof typeof Icon; actions: { to: string; label: string }[] }

const CARDS: Card[] = [
  { id: "structure", icon: "building", title: "Establish your institution",
    why: "Your departments and the offices within them: Director, Legal Counsel, Archivist. Authority belongs to the office, not the person.",
    actions: [{ to: "/admin/setup?step=departments", label: "Add departments and offices" }] },
  { id: "rules", icon: "review", title: "Set your approval rules",
    why: "For each type of record: which offices must approve it, in what order, who may publish it and how long it is kept.",
    actions: [{ to: "/admin/governance", label: "Define approval rules" }] },
  { id: "people", icon: "user", title: "Add your leadership and people",
    why: "Add the people who work in the institution, and place each one in the office they hold. When someone leaves, you reassign the office.",
    actions: [{ to: "/admin/setup?step=people", label: "Add people" }, { to: "/admin/setup?step=assign", label: "Assign offices" }] },
  { id: "signin", icon: "lock", title: "Let your people sign in",
    why: "Send each person an invitation link; they set a password and sign in with their work email. If your institution has its own sign-in (Microsoft Entra, Okta, Google Workspace), connect it instead.",
    actions: [{ to: "/admin/authority", label: "Send invitations" }, { to: "/admin/access", label: "Connect your identity provider" }] },
  { id: "systems", icon: "swap", title: "Connect your systems",
    why: "Optional. Give your own systems an API key so they can submit records, and receive events through webhooks.",
    actions: [{ to: "/admin/access", label: "API keys & webhooks" }] },
  { id: "plan", icon: "seal", title: "Choose your plan",
    why: "The Evaluation is free for 30 days and 10 official records. Subscribe to keep issuing records and to download them.",
    actions: [] },
];

const Welcome: React.FC = () => {
  const { config, error, reload } = useInstitutionConfig();
  const { billing, setBilling } = useBilling();
  const [upgrade, setUpgrade] = useState(false);
  const r = config ? computeReadiness(config, !!billing?.canDownload) : null;
  const step = (id: StepId) => r?.steps.find((s) => s.id === id);
  const firstOpen = r?.steps.find((s) => !s.done)?.id;

  return (
    <div>
      {upgrade && <UpgradeModal open reason="quota" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); setUpgrade(false); reload(); }} />}
      <header className="relative mb-7 overflow-hidden rounded-xl border border-sd-line bg-[#0e1622] px-6 py-7 sm:px-8"
        style={{ backgroundImage: "radial-gradient(90% 120% at 100% 0%, rgba(214,178,106,0.10), transparent 60%), linear-gradient(180deg, rgba(141,187,255,0.05), transparent 70%)" }}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sd-gold">Welcome</div>
        <h1 className="mt-2 font-serif text-[2rem] font-bold leading-tight tracking-tight text-sd-text">Let's set up your institution</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-sd-text2">Six steps take you from an empty account to an institution that issues official records. The first three are the essentials; most institutions finish them in under an hour. Each step ticks itself off when it's done.</p>
        {r && (
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="h-1.5 w-60 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sd-gold transition-all" style={{ width: `${Math.round((r.doneCount / r.steps.length) * 100)}%` }} /></div>
            <span className="font-mono text-[12px] tabular-nums text-sd-text3">{r.doneCount} of {r.steps.length} done</span>
            {r.essentialsDone && <span className="rounded-full bg-[#75c9a1]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#75c9a1]">Essentials complete</span>}
          </div>
        )}
      </header>

      {error && <div role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">Your institution's set-up could not be read. <button onClick={reload} className="font-semibold underline">Try again</button></div>}

      <ol className="grid gap-4 lg:grid-cols-2">
        {CARDS.map((c, i) => {
          const s = step(c.id);
          const next = c.id === firstOpen;
          return (
            <li key={c.id} className={`flex flex-col rounded-xl border p-5 transition ${next ? "border-sd-gold/45 bg-[#121b27] shadow-[0_18px_50px_-30px_rgba(214,178,106,0.45)]" : "border-sd-line bg-sd-panel"}`}>
              <div className="flex items-start gap-3.5">
                <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 ${s?.done ? "bg-[#75c9a1]/12 text-[#75c9a1] ring-[#75c9a1]/40" : next ? "text-sd-gold ring-sd-gold/50" : "text-sd-text3 ring-white/12"}`}>
                  {s?.done ? <Icon.check className="h-[18px] w-[18px]" /> : React.createElement(Icon[c.icon], { className: "h-[18px] w-[18px]" })}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-sd-text3">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="text-[15px] font-semibold text-sd-text">{c.title}</h2>
                    {s && (s.essential ? <span className="rounded bg-white/[0.06] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-sd-text3">Essential</span>
                      : <span className="rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-sd-faint ring-1 ring-white/10">Optional</span>)}
                    {next && <span className="rounded bg-sd-gold/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-sd-gold">Next</span>}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-sd-text2">{c.why}</p>
                  <p className={`mt-2 text-[12px] ${s?.done ? "text-[#75c9a1]" : "text-sd-text3"}`}>{s ? (s.done ? `Done · ${s.detail}` : s.detail) : "…"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 pl-[54px]">
                {c.id === "plan" ? (
                  billing && (billing.canDownload
                    ? <QuotaMeter b={billing} />
                    : <><button onClick={() => setUpgrade(true)} className="rounded-md bg-sd-accentbg px-3 py-1.5 text-[12.5px] font-semibold text-sd-accentink transition hover:bg-white">Choose a plan</button>
                        <QuotaMeter b={billing} className="min-w-[180px] flex-1" /></>)
                ) : c.actions.map((a, j) => (
                  <Link key={a.to + a.label} to={a.to}
                    className={j === 0 && !s?.done ? "rounded-md bg-sd-accentbg px-3 py-1.5 text-[12.5px] font-semibold text-sd-accentink transition hover:bg-white"
                      : "rounded-md border border-sd-line px-3 py-1.5 text-[12.5px] font-semibold text-sd-text2 transition hover:border-sd-accent/40 hover:text-sd-text"}>
                    {a.label} →
                  </Link>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      {r?.essentialsDone && (
        <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#75c9a1]/30 bg-[#75c9a1]/[0.06] px-6 py-5">
          <div>
            <div className="font-serif text-[1.2rem] font-bold text-sd-text">Your institution is ready to issue official records.</div>
            <p className="mt-1 text-[13px] text-sd-text2">From now on, signing in takes you straight to your institution's overview. This page stays under Get started in the menu.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/console/create" className="rounded-md bg-sd-accentbg px-4 py-2 text-[13px] font-semibold text-sd-accentink hover:bg-white">Write your first record →</Link>
            <Link to="/admin" className="rounded-md border border-sd-line px-4 py-2 text-[13px] font-semibold text-sd-text2 hover:text-sd-text">Go to the overview</Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Welcome;
