import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useBilling, QuotaMeter, UpgradeModal } from "../lib/upsell";
import { useInstitutionConfig, computeReadiness, markEstablished, type InstitutionConfig } from "../lib/readiness";
import { createDepartment, deleteDepartment, createGovRole, deleteGovRole, createUser, grantGovRole, upsertGovernancePolicy, humanError, type GovernancePolicy } from "../lib/api";
import { RECORD_TYPES } from "../lib/recordTypes";
import { Icon } from "../components/console/icons";
import { FilmGrain } from "../components/brand";
import { EngravedSeal, Rosette, Ornament, Gilt, GOLD, FIELD, initialsOf } from "../components/premium";

// SET-UP — a new institution's first experience, full screen and outside the console. The home page
// ("ceremony") shows the three essentials as a path; each essential is its own split-screen step: the
// institution and its progress on the left, one question on the right. Until the essentials are in place
// the console is closed (App.tsx gate); once they are, the home page opens the console and the optional
// next steps (sign-in for people, connected systems, the plan), which live in the console.
// Every count and tick is read from the institution's live configuration; nothing is a tick box.

type StepId = "structure" | "rules" | "people";
interface StepDef { id: StepId; title: string; question: string; lede: string; minutes: number }
const STEPS: StepDef[] = [
  { id: "structure", title: "Establish your institution", question: "How is your institution organised?", minutes: 10,
    lede: "Add the departments your institution is organised into, and the offices within them. Authority belongs to the office, not the person, so governance never depends on who holds it." },
  { id: "rules", title: "Set your approval rules", question: "Who must approve your records?", minutes: 10,
    lede: "Choose a type of record, then the offices that approve it, in order. A record is published only after every office in its chain has approved it." },
  { id: "people", title: "Add leadership and people", question: "Who holds your offices?", minutes: 15,
    lede: "Add the people who work in the institution and place each one in the office they hold. When someone leaves, you reassign the office; the rules stay as they are." },
];

const BTN = "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
const GHOST = "border border-sd-line text-sd-text2 hover:border-sd-gold/40 hover:text-sd-text";
const LABEL = "mb-1.5 block text-[12px] text-sd-text3";
const ROMAN = ["I", "II", "III"];
const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

interface StepState { done: boolean; available: boolean; detail: string }
function stepStates(c: InstitutionConfig | null): Record<StepId, StepState> {
  const r = c ? computeReadiness(c, false) : null;
  const d = (id: "structure" | "rules" | "people") => r?.steps.find((s) => s.id === id);
  const done = { structure: !!d("structure")?.done, rules: !!d("rules")?.done, people: !!d("people")?.done };
  return {
    structure: { done: done.structure, available: true, detail: d("structure")?.detail ?? "" },
    rules: { done: done.rules, available: done.structure || done.rules, detail: d("rules")?.detail ?? "" },
    people: { done: done.people, available: (done.structure && done.rules) || done.people, detail: d("people")?.detail ?? "" },
  };
}

const Seal: React.FC<{ text: string; size: number; className?: string }> = ({ text, size, className = "" }) => (
  <span aria-hidden className={`relative grid shrink-0 place-items-center rounded-full border border-sd-gold/55 bg-[radial-gradient(circle_at_30%_25%,rgba(201,173,117,0.22),transparent_65%)] font-serif font-semibold text-sd-text shadow-[0_0_30px_-8px_rgba(201,173,117,0.6)] ${className}`}
    style={{ width: size, height: size, fontSize: Math.round(size * 0.27) }}>
    <span className="absolute inset-[4px] rounded-full border border-sd-gold/25" />{text}
  </span>
);

// ── the route: full screen, administrators only ────────────────────────────────────────────────────
const Setup: React.FC = () => {
  const { config, error, reload } = useInstitutionConfig();
  const { billing } = useBilling();
  const { session } = useAuth();
  const name = billing?.institution?.trim() || "your institution";
  const states = useMemo(() => stepStates(config), [config]);
  const essentialsDone = states.structure.done && states.rules.done && states.people.done;
  useEffect(() => { if (essentialsDone && session) markEstablished(session.token); }, [essentialsDone, session]);
  const ctx = { config, error, reload, name, states, essentialsDone };
  return (
    <div className="min-h-full bg-sd-bg text-sd-text">
      <Routes>
        <Route index element={<SetupHome {...ctx} />} />
        <Route path=":step" element={<SetupStep {...ctx} />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    </div>
  );
};

interface Ctx { config: InstitutionConfig | null; error: boolean; reload: () => void; name: string; states: Record<StepId, StepState>; essentialsDone: boolean }

const SignOut: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { signOut } = useAuth();
  const nav = useNavigate();
  return <button onClick={() => { signOut(); nav("/"); }} className={`font-semibold text-sd-text2 hover:text-sd-text ${className}`}>Sign out</button>;
};

// ── home: the ceremony ───────────────────────────────────────────────────────────────────────────
const SetupHome: React.FC<Ctx> = ({ config, error, reload, name, states, essentialsDone }) => {
  const { session } = useAuth();
  const { billing, setBilling } = useBilling();
  const [upgrade, setUpgrade] = useState(false);
  const current = STEPS.find((s) => !states[s.id].done);
  const named = name !== "your institution";
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundImage: "radial-gradient(60% 52% at 50% 0%, rgba(201,173,117,0.16), transparent 70%), radial-gradient(45% 40% at 100% 100%, rgba(141,187,255,0.07), transparent 70%), radial-gradient(35% 35% at 0% 80%, rgba(201,173,117,0.05), transparent 70%)" }}>
      <FilmGrain />
      {upgrade && <UpgradeModal open reason="quota" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); setUpgrade(false); }} />}
      <header className="relative z-10 flex h-16 items-center px-6 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(201,173,117,0.28),transparent)] sm:px-11">
        <Seal text="SD" size={34} />
        <span className="ml-3 text-[14px] font-semibold">Sovereign <span className="font-normal text-sd-text2">Dispatch</span></span>
        <span className="ml-auto text-[13px] text-sd-text3">
          <span className="hidden sm:inline">{session?.kind === "person" ? `Signed in as ${session.subject}` : "Signed in with the administrator key"} · </span><SignOut />
        </span>
      </header>

      <section className="relative px-4 pt-7 text-center">
        <Rosette className="absolute left-1/2 top-[-178px] h-[520px] w-[520px] -translate-x-1/2 opacity-[0.22]" />
        <EngravedSeal initials={named ? initialsOf(name) : "SD"} size={124} className="su-rise relative mx-auto" />
        <div className="su-rise relative mt-5 font-mono text-[10.5px] uppercase tracking-[0.26em] text-sd-gold" style={{ animationDelay: "80ms" }}>{named ? name : "Welcome to Sovereign Dispatch"}</div>
        <Ornament className="su-rise relative mt-3" />
        <h1 className="su-rise relative mx-auto mt-3.5 max-w-4xl font-serif text-[36px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[52px]" style={{ animationDelay: "140ms" }}>
          {essentialsDone ? <>Your institution is <Gilt>established</Gilt></> : <>Let's establish <Gilt>your institution</Gilt></>}
        </h1>
        <p className="su-rise relative mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-sd-text2" style={{ animationDelay: "200ms" }}>
          {essentialsDone
            ? "Its structure, approval rules and people are in place. The console is open: invite your people, connect your systems and issue your first official record."
            : "Three essentials make your institution ready to issue official records. Most institutions finish them in under an hour, and everything is saved as you go."}
        </p>
        {essentialsDone && (
          <Link to="/admin" className={`${BTN} ${GOLD} su-rise relative mt-7 px-7 py-3 text-[14.5px]`} style={{ animationDelay: "260ms" }}>Open the console <Icon.arrowRight className="h-4 w-4" /></Link>
        )}
      </section>

      {error && <p role="alert" className="relative mx-auto mt-6 max-w-xl rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">Your institution's set-up could not be read. <button onClick={reload} className="font-semibold underline">Try again</button></p>}

      <section className="relative mx-auto mt-9 w-full max-w-[1180px] px-4 sm:px-6">
        <div aria-hidden className="absolute left-[16%] right-[16%] top-[51px] hidden h-px bg-[linear-gradient(90deg,#c9ad75,rgba(201,173,117,0.35)_48%,rgba(38,53,72,0.9))] md:block" />
        <ol className="relative grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const st = states[s.id];
            const isNext = current?.id === s.id;
            return (
              <li key={s.id} style={{ animationDelay: `${260 + i * 90}ms` }}
                className={`su-rise group relative flex flex-col overflow-hidden rounded-[20px] border bg-[linear-gradient(180deg,rgba(24,36,53,0.94),rgba(12,19,29,0.96))] px-6 pb-5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-300 hover:-translate-y-0.5 ${isNext ? "border-sd-gold/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_30px_80px_-42px_rgba(201,173,117,0.7)]" : st.done ? "border-sd-ok/30" : "border-sd-line hover:border-sd-line"}`}>
                {/* gold hairline along the top edge */}
                <span aria-hidden className={`absolute inset-x-8 top-0 h-px ${isNext ? "bg-[linear-gradient(90deg,transparent,#e4cc95,transparent)]" : st.done ? "bg-[linear-gradient(90deg,transparent,rgba(117,201,161,0.6),transparent)]" : "bg-[linear-gradient(90deg,transparent,rgba(201,173,117,0.25),transparent)]"}`} />
                {isNext && <span aria-hidden className="su-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-[linear-gradient(90deg,transparent,rgba(236,215,166,0.07),transparent)]" />}
                <div className="flex justify-center">
                  <span className={`grid h-[52px] w-[52px] place-items-center rounded-full font-serif text-[18px] font-semibold tracking-[0.04em] ring-[5px] ring-sd-bg ${st.done ? "border border-sd-ok/50 bg-[#0f1f1a] text-sd-ok" : isNext ? "bg-[linear-gradient(180deg,#ecd7a6,#c9ad75_60%,#b8975c)] text-[#1d160a] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_0_24px_-4px_rgba(201,173,117,.6)]" : "border border-sd-gold/25 bg-[#0d1520] text-sd-text2"}`}>
                    {st.done ? <Icon.check className="h-5 w-5" /> : ROMAN[i]}
                  </span>
                </div>
                <div className="mt-4 text-center">
                  <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em] ${st.done ? "bg-sd-ok/15 text-sd-ok" : isNext ? "bg-sd-gold/15 text-sd-gold" : "bg-white/5 text-sd-text3"}`}>{st.done ? "Done" : isNext ? (i === 0 ? "Start here" : "Next") : "Essential"}</span>
                </div>
                <h2 className={`mt-3 text-center font-serif text-[22px] font-semibold tracking-[-0.01em] ${st.done || isNext ? "text-sd-text" : "text-sd-text2"}`}>{s.title}</h2>
                <p className={`mt-2 flex-1 text-center text-[13.5px] leading-relaxed ${isNext ? "text-sd-text2" : "text-sd-text3"}`}>{s.lede.split(". ")[0]}.</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-4">
                  <span className={`font-mono text-[11.5px] ${st.done ? "text-sd-ok" : "text-sd-text3"}`}>{config ? (st.done ? st.detail : `≈ ${s.minutes} min`) : "…"}</span>
                  {st.done ? <Link to={`/setup/${s.id}`} className={`${BTN} ${GHOST} px-3 py-1.5 text-[12.5px]`}>Review</Link>
                    : isNext ? <Link to={`/setup/${s.id}`} className={`${BTN} ${GOLD}`}>{i === 0 ? "Begin" : "Continue"} <Icon.arrowRight className="h-3.5 w-3.5" /></Link>
                    : <span className="text-[12.5px] text-sd-text3">After step {i}</span>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="relative mx-auto mt-9 w-full max-w-[1180px] px-4 pb-12 sm:px-6">
        <div className="mb-4 flex items-center gap-3.5"><span className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-sd-text3">{essentialsDone ? "Next, in the console" : "Then, when you're ready"}</span><span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,rgba(201,173,117,0.3),transparent)]" /></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "users" as const, title: "Let your people sign in", line: "Invitation links, or your identity provider", to: "/admin/authority" },
            { icon: "key" as const, title: "Connect your systems", line: "API keys and webhooks", to: "/admin/access" },
          ].map((t) => {
            const body = <><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ${essentialsDone ? "text-sd-gold ring-sd-gold/40" : "text-sd-text3 ring-white/10"}`}>{React.createElement(Icon[t.icon], { className: "h-4 w-4" })}</span>
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold">{t.title}</span><span className="block text-[12px] text-sd-text3">{t.line}</span></span>
              {essentialsDone ? <Icon.arrowRight className="h-4 w-4 text-sd-text3" /> : <Icon.lock className="h-3.5 w-3.5 text-sd-faint" />}</>;
            return essentialsDone
              ? <Link key={t.title} to={t.to} className="flex items-center gap-3.5 rounded-2xl border border-sd-soft bg-[linear-gradient(180deg,rgba(17,26,38,0.8),rgba(12,19,29,0.8))] px-4 py-4 transition hover:-translate-y-0.5 hover:border-sd-gold/40">{body}</Link>
              : <div key={t.title} aria-disabled="true" className="flex items-center gap-3.5 rounded-2xl border border-sd-soft bg-[linear-gradient(180deg,rgba(17,26,38,0.55),rgba(12,19,29,0.55))] px-4 py-4">{body}</div>;
          })}
          <div className="flex items-center gap-3.5 rounded-2xl border border-sd-soft bg-[linear-gradient(180deg,rgba(17,26,38,0.8),rgba(12,19,29,0.8))] px-4 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sd-gold ring-1 ring-sd-gold/40"><Icon.seal className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold">Choose your plan</span>
              {billing ? <QuotaMeter b={billing} className="mt-1" /> : <span className="block text-[12px] text-sd-text3">Evaluation: 30 days and 10 records</span>}
            </span>
            {billing && !billing.canDownload && <button onClick={() => setUpgrade(true)} className="rounded-md border border-sd-line px-2.5 py-1 text-[12px] font-semibold text-sd-text2 hover:text-sd-text">Plans</button>}
          </div>
        </div>
        <p className="mt-7 text-center text-[12.5px] text-sd-text3">
          {essentialsDone ? <>Running more than one institution? Each is its own isolated account. <a href="/signup" className="font-semibold text-sd-text2 hover:text-sd-text">Establish another →</a></>
            : <><Icon.lock className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />Your console opens once the three essentials are complete.</>}
        </p>
        <Ornament className="mt-6 opacity-60" />
        <p className="mt-4 text-center font-mono text-[9.5px] uppercase tracking-[0.24em] text-sd-faint">Private to your institution <span className="mx-2 text-sd-gold/60">·</span> Every act audited <span className="mx-2 text-sd-gold/60">·</span> Records sealed for preservation</p>
      </section>
    </div>
  );
};

// ── one step: split screen ────────────────────────────────────────────────────────────────────────
const SetupStep: React.FC<Ctx> = (ctx) => {
  const { step: param } = useParams();
  const nav = useNavigate();
  const idx = STEPS.findIndex((s) => s.id === param);
  if (idx < 0) return <Navigate to="/setup" replace />;
  const step = STEPS[idx];
  const st = ctx.states[step.id];
  if (ctx.config && !st.available) return <Navigate to="/setup" replace />;
  const doneCount = STEPS.filter((s) => ctx.states[s.id].done).length;
  const next = STEPS[idx + 1];
  const named = ctx.name !== "your institution";
  const C = 2 * Math.PI * 31;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* the institution and its progress */}
      <aside className="relative overflow-hidden border-b border-sd-soft px-6 py-8 sm:px-12 lg:w-[540px] lg:shrink-0 lg:border-b-0 lg:border-r lg:py-11"
        style={{ backgroundImage: "radial-gradient(90% 60% at 0% 0%, rgba(201,173,117,0.2), transparent 60%), radial-gradient(80% 50% at 100% 100%, rgba(141,187,255,0.1), transparent 60%), linear-gradient(180deg, #0f1722, #0a0f17)" }}>
        <Rosette className="absolute -right-[380px] top-[360px] hidden h-[640px] w-[640px] opacity-[0.15] lg:block" />
        <Link to="/setup" className="relative flex items-center gap-3"><Seal text="SD" size={40} /><span className="text-[15px] font-semibold">Sovereign <span className="font-normal text-sd-text2">Dispatch</span></span></Link>
        <div className="relative mt-10 lg:mt-16">
          <div className="flex items-center gap-4">
            <EngravedSeal initials={named ? initialsOf(ctx.name) : "SD"} size={64} />
            <div className="min-w-0"><div className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-sd-gold">Establishing</div>
              <div className="mt-1.5 font-serif text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] lg:text-[34px]">{named ? ctx.name : "Your institution"}</div></div>
          </div>
          <div className="mt-7 flex items-center gap-4">
            <svg width="74" height="74" viewBox="0 0 74 74" aria-hidden>
              <circle cx="37" cy="37" r="31" stroke="rgba(255,255,255,.08)" strokeWidth="5" fill="none" />
              <defs><linearGradient id="su-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0dcab" /><stop offset="1" stopColor="#a8884f" /></linearGradient></defs>
              {Array.from({ length: 36 }, (_, i) => <line key={i} x1="37" y1="1.5" x2="37" y2={i % 12 === 0 ? 4.5 : 3.2} stroke="#c9ad75" strokeOpacity=".4" strokeWidth=".6" transform={`rotate(${i * 10} 37 37)`} />)}
              <circle cx="37" cy="37" r="31" stroke="url(#su-ring)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={`${(C * doneCount) / 3} ${C}`} transform="rotate(-90 37 37)" />
              <text x="37" y="42" textAnchor="middle" fill="#edf2f8" fontFamily="Fraunces, Georgia, serif" fontSize="17" fontWeight="600">{doneCount}/3</text>
            </svg>
            <div><div className="text-[14.5px] font-semibold">Essentials in place</div>
              <div className="mt-0.5 text-[12.5px] text-sd-text3">{doneCount === 3 ? "The console is open" : `About ${STEPS.filter((s) => !ctx.states[s.id].done).reduce((n, s) => n + s.minutes, 0)} minutes to go`}</div></div>
          </div>
          <ol className="relative mt-7 space-y-1 before:absolute before:bottom-[22px] before:left-[12.5px] before:top-[22px] before:w-px before:bg-[linear-gradient(180deg,rgba(201,173,117,0.5),rgba(38,53,72,0.9))]">
            {STEPS.map((s, i) => {
              const ss = ctx.states[s.id];
              const here = s.id === step.id;
              const dot = ss.done ? "border border-sd-ok/45 bg-sd-ok/15 text-sd-ok" : here ? "bg-[linear-gradient(180deg,#e4cc95,#c9ad75)] text-[#1d160a]" : "border border-sd-line text-sd-text3";
              const row = <><span className={`relative grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#0c131d] font-serif text-[11px] font-semibold ${dot}`}>{ss.done ? "✓" : ROMAN[i]}</span>
                <span className={here ? "font-semibold text-sd-text" : ss.done ? "text-sd-text2" : "text-sd-text3"}>{s.title}</span>
                <span className={`ml-auto font-mono text-[11px] ${here ? "text-sd-gold" : "text-sd-ok"}`}>{here ? "now" : ss.done ? ss.detail : ""}</span></>;
              return <li key={s.id}>{ss.available && !here
                ? <Link to={`/setup/${s.id}`} className="flex items-center gap-3.5 rounded-lg py-2 text-[14px] hover:bg-white/[0.03]">{row}</Link>
                : <div className="flex items-center gap-3.5 py-2 text-[14px]" aria-current={here ? "step" : undefined}>{row}</div>}</li>;
            })}
          </ol>
        </div>
        <blockquote className="relative mt-10 border-l-2 border-sd-gold pl-4 font-serif text-[17px] italic leading-relaxed text-sd-text2 lg:absolute lg:bottom-11 lg:left-12 lg:right-12 lg:mt-0">
          “Institutions endure; employees change.”
          <span className="mt-2 block font-sans text-[12px] not-italic text-sd-text3">Governance is set against offices, so it never depends on who holds them.</span>
        </blockquote>
      </aside>

      {/* the question */}
      <main className="flex min-w-0 flex-1 flex-col px-6 py-8 sm:px-12 lg:px-20 lg:py-14">
        <div className="flex items-center justify-between text-[13px] text-sd-text3">
          <span className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-sd-gold">Step {ROMAN[idx]} of III<span aria-hidden className="h-px w-16 bg-[linear-gradient(90deg,#c9ad75,transparent)]" /></span>
          <span>Saved as you go · <SignOut /></span>
        </div>
        <h1 className="su-rise mt-5 font-serif text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[40px]">{step.question}</h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-sd-text2">{step.lede}</p>
        <div className="su-rise mt-8 max-w-[820px] flex-1" style={{ animationDelay: "90ms" }}>
          {!ctx.config ? <p className="text-sm text-sd-text3">{ctx.error ? "Your institution's set-up could not be read." : "Loading…"}</p>
            : step.id === "structure" ? <StructureStep config={ctx.config} reload={ctx.reload} />
            : step.id === "rules" ? <RulesStep config={ctx.config} reload={ctx.reload} />
            : <PeopleStep config={ctx.config} reload={ctx.reload} />}
        </div>
        <div className="mt-10 flex max-w-[820px] items-center justify-between gap-4">
          <button onClick={() => nav(idx === 0 ? "/setup" : `/setup/${STEPS[idx - 1].id}`)} className={`${BTN} ${GHOST}`}><Icon.arrowLeft className="h-3.5 w-3.5" /> Back</button>
          <div className="flex items-center gap-3">
            {!st.done && <span className="hidden text-[12.5px] text-sd-text3 sm:inline">{step.id === "structure" ? "Add at least one department and one office." : step.id === "rules" ? "Save at least one approval rule." : "Add a person and place them in an office."}</span>}
            <button disabled={!st.done} onClick={() => nav(next && !ctx.essentialsDone ? `/setup/${next.id}` : "/setup")} className={`${BTN} ${GOLD}`}>
              {next && !ctx.essentialsDone ? "Save and continue" : "Finish"} <Icon.arrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// ── step bodies ───────────────────────────────────────────────────────────────────────────────────
const useAct = (reload: () => void) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const act = async (fn: () => Promise<unknown>, fallback: string): Promise<boolean> => {
    setBusy(true); setErr(null);
    try { await fn(); reload(); return true; }
    catch (e) { setErr(humanError(e, fallback)); return false; }
    finally { setBusy(false); }
  };
  return { busy, err, act };
};
const Err: React.FC<{ text: string | null }> = ({ text }) => text ? <p role="alert" className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-300">{text}</p> : null;
const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="relative overflow-hidden rounded-[18px] border border-sd-line bg-[linear-gradient(180deg,rgba(20,30,44,0.95),rgba(12,19,29,0.95))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_60px_-40px_rgba(0,0,0,0.9)] sm:p-6">
    <span aria-hidden className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,173,117,0.35),transparent)]" />
    <div className="flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-sd-text3"><span aria-hidden className="h-1 w-1 rotate-45 bg-sd-gold/70" />{title}</div>
    <div className="mt-3">{children}</div>
  </section>
);
const Chip: React.FC<{ children: React.ReactNode; onRemove?: () => void; removeLabel?: string }> = ({ children, onRemove, removeLabel }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-sd-gold/20 bg-[linear-gradient(180deg,rgba(201,173,117,0.10),rgba(201,173,117,0.03))] py-1 pl-3 pr-2 text-[12.5px]">
    {children}
    {onRemove && <button onClick={onRemove} aria-label={removeLabel} className="rounded-full px-1 text-sd-text3 hover:text-red-300">✕</button>}
  </span>
);
const Primary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", ...p }) =>
  <button {...p} className={`h-11 shrink-0 rounded-[10px] bg-sd-accentbg px-4 text-[13.5px] font-semibold text-sd-accentink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:bg-white disabled:opacity-40 ${className}`} />;

const StructureStep: React.FC<{ config: InstitutionConfig; reload: () => void }> = ({ config, reload }) => {
  const { busy, err, act } = useAct(reload);
  const [dept, setDept] = useState("");
  const [office, setOffice] = useState(""); const [officeDept, setOfficeDept] = useState("");
  const deptName = (k?: string | null) => config.departments.find((d) => d.key === k)?.name;
  const addDept = async () => { const n = dept.trim(); if (n && await act(() => createDepartment(slug(n), n, (config.departments.length + 1) * 10), "The department could not be added.")) setDept(""); };
  const addOffice = async () => { const n = office.trim(); if (n && await act(() => createGovRole(slug(n), n, officeDept || undefined, (config.roles.length + 1) * 10), "The office could not be added.")) setOffice(""); };
  return (
    <div className="space-y-5">
      <Panel title="Departments">
        <div className="flex flex-wrap gap-2">
          {config.departments.length === 0 && <span className="text-[13px] text-sd-text3">None yet. Policy, Legal Affairs, Communications, Archives…</span>}
          {config.departments.map((d) => <Chip key={d.key} onRemove={() => act(() => deleteDepartment(d.key), "Remove its offices first, then the department.")} removeLabel={`Remove ${d.name}`}>{d.name}</Chip>)}
        </div>
        <form className="mt-4 flex gap-2.5" onSubmit={(e) => { e.preventDefault(); void addDept(); }}>
          <label className="sr-only" htmlFor="su-dept">Department name</label>
          <input id="su-dept" className={FIELD} value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Department name" />
          <Primary type="submit" disabled={!dept.trim() || busy}>Add department</Primary>
        </form>
      </Panel>
      <Panel title="Offices">
        <div className="flex flex-wrap gap-2">
          {config.roles.length === 0 && <span className="text-[13px] text-sd-text3">None yet. Director of Policy, Legal Counsel, Permanent Secretary…</span>}
          {config.roles.map((r) => <Chip key={r.key} onRemove={() => act(() => deleteGovRole(r.key), "The office could not be removed.")} removeLabel={`Remove ${r.label}`}>{r.label}{deptName(r.department_key) && <span className="text-sd-text3"> · {deptName(r.department_key)}</span>}</Chip>)}
        </div>
        <form className="mt-4 grid gap-2.5 sm:grid-cols-[1fr_210px_auto]" onSubmit={(e) => { e.preventDefault(); void addOffice(); }}>
          <label className="sr-only" htmlFor="su-office">Office name</label>
          <input id="su-office" className={FIELD} value={office} onChange={(e) => setOffice(e.target.value)} placeholder="Office name" />
          <label className="sr-only" htmlFor="su-office-dept">Department of the office</label>
          <select id="su-office-dept" className={FIELD} value={officeDept} onChange={(e) => setOfficeDept(e.target.value)}>
            <option value="">No department</option>
            {config.departments.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
          </select>
          <Primary type="submit" disabled={!office.trim() || busy}>Add office</Primary>
        </form>
      </Panel>
      <Err text={err} />
    </div>
  );
};

const RETENTION = [{ d: 365, l: "1 year" }, { d: 1095, l: "3 years" }, { d: 2555, l: "7 years" }, { d: 3650, l: "10 years" }, { d: 9125, l: "25 years" }];
const typeLabel = (t: string) => RECORD_TYPES.find((x) => x.docType === t)?.label ?? t.replace(/_/g, " ");
const retentionLabel = (d?: number | null) => RETENTION.find((r) => r.d === d)?.l ?? (d ? `${Math.round(d / 365)} years` : null);
function ruleSentence(p: Pick<GovernancePolicy, "docType" | "reviewChain" | "publicationAuthority" | "retentionDays">, office: (k: string) => string): string {
  const chain = p.reviewChain.filter((s) => s.role).map((s) => office(s.role!));
  const by = chain.length === 1 ? chain[0] : `${chain.slice(0, -1).join(", ")}, then ${chain[chain.length - 1]}`;
  const kept = retentionLabel(p.retentionDays);
  return `${typeLabel(p.docType)}: approved by ${chain.length ? `the ${by}` : "no office yet"}${p.publicationAuthority ? `; published by the ${office(p.publicationAuthority)}` : ""}${kept ? `; kept for ${kept}` : ""}.`;
}

const RulesStep: React.FC<{ config: InstitutionConfig; reload: () => void }> = ({ config, reload }) => {
  const { busy, err, act } = useAct(reload);
  const office = (k: string) => config.roles.find((r) => r.key === k)?.label ?? k;
  const ruled = new Set(config.policies.filter((p) => p.reviewChain?.some((s) => s.role)).map((p) => p.docType));
  const [docType, setDocType] = useState(() => RECORD_TYPES.find((t) => !ruled.has(t.docType))?.docType ?? RECORD_TYPES[0].docType);
  const [chain, setChain] = useState<string[]>([]);
  const [publisher, setPublisher] = useState("");
  const [retention, setRetention] = useState(3650);
  const draft = { docType, reviewChain: chain.map((role) => ({ role, label: office(role), quorum: 1 })), publicationAuthority: publisher || null, retentionDays: retention };
  const save = async () => {
    const ok = await act(() => upsertGovernancePolicy({
      name: typeLabel(docType), docType, classificationLevel: null, requiredApprovals: chain.length, reviewChain: draft.reviewChain,
      approvalAuthority: null, publicationAuthority: publisher || null, retentionDays: retention,
      autoApproveService: false, sequential: true, approvalTtlDays: null, active: true,
    }), "The approval rule could not be saved.");
    if (ok) { setChain([]); setPublisher(""); const nextType = RECORD_TYPES.find((t) => t.docType !== docType && !ruled.has(t.docType)); if (nextType) setDocType(nextType.docType); }
  };
  const existing = config.policies.filter((p) => p.reviewChain?.some((s) => s.role));
  if (config.roles.length === 0) return <p className="rounded-xl border border-sd-warn/30 bg-sd-warn/10 px-4 py-3 text-[13.5px] text-sd-warn">Add your offices first: an approval rule is a chain of offices. <Link to="/setup/structure" className="font-semibold underline">Go to step 1</Link></p>;
  return (
    <div className="space-y-5">
      {existing.length > 0 && (
        <Panel title={`Your approval rules · ${existing.length}`}>
          <ul className="space-y-2">{existing.map((p) => <li key={p.docType} className="flex gap-2.5 text-[13.5px] text-sd-text2"><Icon.check className="mt-0.5 h-4 w-4 shrink-0 text-sd-ok" />{ruleSentence(p, office)}</li>)}</ul>
        </Panel>
      )}
      <Panel title={existing.length ? "Add another rule" : "Your first rule"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block" htmlFor="su-type"><span className={LABEL}>Type of record</span>
            <select id="su-type" className={FIELD} value={docType} onChange={(e) => setDocType(e.target.value)}>
              {RECORD_TYPES.map((t) => <option key={t.docType} value={t.docType}>{t.label}{ruled.has(t.docType) ? " (has a rule; saving replaces it)" : ""}</option>)}
            </select></label>
          <label className="block" htmlFor="su-keep"><span className={LABEL}>Kept for</span>
            <select id="su-keep" className={FIELD} value={retention} onChange={(e) => setRetention(Number(e.target.value))}>
              {RETENTION.map((r) => <option key={r.d} value={r.d}>{r.l}</option>)}
            </select></label>
        </div>
        <div className="mt-5"><span className={LABEL}>Approved by, in this order</span>
          <div className="flex flex-wrap items-center gap-2.5">
            {chain.map((k, i) => (
              <React.Fragment key={k}>
                {i > 0 && <Icon.arrowRight className="h-3.5 w-3.5 text-sd-text3" />}
                <span className="inline-flex items-center gap-2 rounded-[10px] border border-sd-line bg-sd-raised px-3 py-2 text-[13.5px]">
                  <span className="font-mono text-[11px] text-sd-gold">{i + 1}</span>{office(k)}
                  <button onClick={() => setChain(chain.filter((x) => x !== k))} aria-label={`Remove ${office(k)} from the chain`} className="text-sd-text3 hover:text-red-300">✕</button>
                </span>
              </React.Fragment>
            ))}
            {config.roles.some((r) => !chain.includes(r.key)) && (
              <select aria-label="Add an office to the chain" className="rounded-[10px] border border-dashed border-sd-line bg-transparent px-3 py-2 text-[13.5px] text-sd-text3" value=""
                onChange={(e) => e.target.value && setChain([...chain, e.target.value])}>
                <option value="">+ Add an office</option>
                {config.roles.filter((r) => !chain.includes(r.key)).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            )}
          </div>
        </div>
        <label className="mt-5 block max-w-sm" htmlFor="su-pub"><span className={LABEL}>Published by</span>
          <select id="su-pub" className={FIELD} value={publisher} onChange={(e) => setPublisher(e.target.value)}>
            <option value="">Any office in the chain</option>
            {config.roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select></label>
        {chain.length > 0 && (
          <p className="mt-5 rounded-xl border border-sd-ok/25 bg-sd-ok/[0.06] px-4 py-3 text-[13.5px] leading-relaxed text-sd-text2">
            <span className="font-semibold text-sd-ok">In plain words: </span>{ruleSentence(draft, office)}
          </p>
        )}
        <div className="mt-5 flex justify-end"><Primary onClick={() => void save()} disabled={chain.length === 0 || busy}>{busy ? "Saving…" : "Save this rule"}</Primary></div>
      </Panel>
      <Err text={err} />
      <p className="text-[12px] text-sd-text3">Need more control, like classification levels, quorum or approval deadlines? Every rule can be refined later under Approval rules in the console.</p>
    </div>
  );
};

const PeopleStep: React.FC<{ config: InstitutionConfig; reload: () => void }> = ({ config, reload }) => {
  const { busy, err, act } = useAct(reload);
  const [p, setP] = useState({ fullName: "", email: "", office: "", systemAdmin: false });
  const [csv, setCsv] = useState(""); const [msg, setMsg] = useState<string | null>(null);
  const officesOf = (subject: string) => config.grants.filter((g) => g.subject === subject).map((g) => config.roles.find((r) => r.key === g.role_key)?.label ?? g.role_key);
  const add = async () => {
    const ok = await act(async () => {
      const r = await createUser({ fullName: p.fullName.trim(), email: p.email.trim(), systemAdmin: p.systemAdmin });
      if (p.office) await grantGovRole(r.subject ?? `user:${r.id}`, p.office);
    }, "The person could not be added.");
    if (ok) setP({ fullName: "", email: "", office: "", systemAdmin: false });
  };
  const importList = async () => {
    const rows = csv.split("\n").map((l) => l.split(",").map((c) => c.trim())).filter((r) => r[0]);
    let added = 0, skipped = 0;
    await act(async () => {
      for (const [fullName, email, officeName] of rows) {
        if (!fullName || !email?.includes("@")) { skipped++; continue; }
        try {
          const r = await createUser({ fullName, email });
          const role = officeName ? config.roles.find((x) => x.label.toLowerCase() === officeName.toLowerCase() || x.key === officeName) : undefined;
          if (role) await grantGovRole(r.subject ?? `user:${r.id}`, role.key);
          added++;
        } catch { skipped++; }
      }
    }, "The list could not be imported.");
    setMsg(`Added ${added} ${added === 1 ? "person" : "people"}${skipped ? `; ${skipped} line${skipped === 1 ? "" : "s"} skipped` : ""}.`); setCsv("");
  };
  return (
    <div className="space-y-5">
      <Panel title="Add a person">
        <form className="grid gap-2.5 sm:grid-cols-[1.1fr_1.3fr_1fr]" onSubmit={(e) => { e.preventDefault(); void add(); }}>
          <label className="sr-only" htmlFor="su-name">Full name</label>
          <input id="su-name" className={FIELD} value={p.fullName} onChange={(e) => setP({ ...p, fullName: e.target.value })} placeholder="Full name" />
          <label className="sr-only" htmlFor="su-email">Work email</label>
          <input id="su-email" className={FIELD} type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} placeholder="name@institution.org" />
          <label className="sr-only" htmlFor="su-holds">Office they hold</label>
          <select id="su-holds" className={FIELD} value={p.office} onChange={(e) => setP({ ...p, office: e.target.value })}>
            <option value="">Office they hold…</option>
            {config.roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-[12.5px] text-sd-text2 sm:col-span-2">
            <input type="checkbox" checked={p.systemAdmin} onChange={(e) => setP({ ...p, systemAdmin: e.target.checked })} />
            Can also administer Dispatch (IT permissions, separate from the office's authority)
          </label>
          <div className="flex justify-end"><Primary type="submit" disabled={!p.fullName.trim() || !p.email.includes("@") || busy}>Add person</Primary></div>
        </form>
      </Panel>
      <Panel title={`People · ${config.people.length}`}>
        {config.people.length === 0 ? <p className="text-[13px] text-sd-text3">No one yet. Start with your leadership: the people whose offices approve and publish.</p> : (
          <ul className="divide-y divide-sd-soft">
            {config.people.map((person) => {
              const held = officesOf(person.subject);
              return (
                <li key={person.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sd-gold/10 font-mono text-[10.5px] font-semibold ring-1 ring-sd-gold/40" aria-hidden>{initialsOf(person.fullName).toUpperCase().slice(0, 2)}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold">{person.fullName}</span><span className="block truncate text-[12px] text-sd-text3">{person.email}</span></span>
                  {held.length ? <span className="flex flex-wrap gap-1.5">{held.map((h) => <span key={h} className="rounded-full bg-sd-gold/[0.12] px-2.5 py-0.5 text-[12px] text-sd-gold ring-1 ring-sd-gold/30">{h}</span>)}</span>
                    : <select aria-label={`Place ${person.fullName} in an office`} className="rounded-lg border border-dashed border-sd-line bg-transparent px-2.5 py-1.5 text-[12.5px] text-sd-text3" value=""
                        onChange={(e) => e.target.value && void act(() => grantGovRole(person.subject, e.target.value), "The office could not be assigned.")}>
                        <option value="">Place in an office…</option>
                        {config.roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </select>}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <details className="rounded-2xl border border-sd-soft px-5 py-4 text-[13px] text-sd-text2">
        <summary className="cursor-pointer font-semibold text-sd-text">Add many people at once</summary>
        <p className="mt-2 text-[12.5px] text-sd-text3">Paste one person per line: <span className="font-mono">Full name, email, office</span> (the office is optional and must match an office's name). From a spreadsheet or a directory export.</p>
        <textarea aria-label="People to import" className="mt-3 h-24 w-full rounded-[10px] border border-sd-line bg-[#0b131d] px-3.5 py-2.5 font-mono text-[12px] text-sd-text placeholder:text-sd-faint outline-none transition focus:border-sd-gold/60 focus:ring-[3px] focus:ring-sd-gold/15" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"Amina Okafor, a.okafor@institution.org, Director of Policy\nKofi Mensah, k.mensah@institution.org"} />
        <div className="mt-3 flex items-center gap-3"><Primary onClick={() => void importList()} disabled={!csv.trim() || busy}>Import</Primary>{msg && <span className="text-[12.5px] text-sd-ok">{msg}</span>}</div>
      </details>
      <Err text={err} />
      <p className="text-[12px] text-sd-text3">Once the console opens, you'll send each person their sign-in invitation from People &amp; offices.</p>
    </div>
  );
};

export default Setup;
