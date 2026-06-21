import { motion } from "framer-motion";
import { PenLine, Languages, Store, GraduationCap, Landmark } from "lucide-react";

// The Global Knowledge Network — Polished Pages' signature, and the visual
// payoff of the hero's arc overture. The same five numbered acts
// (01 Create → 05 Institutionalize) drawn as one living, connected system, with
// the content and institutions that flow through each stage. The numbering is a
// brand device reused across the site (hero overture, feature chapters, here).
const STAGES = [
  { n: "01", icon: PenLine, label: "Create", tint: "hsl(221 83% 62%)", chips: ["Books", "Children's", "Curricula", "Assessments", "Storybooks"] },
  { n: "02", icon: Languages, label: "Localize", tint: "hsl(160 84% 50%)", chips: ["EN", "ES", "FR", "AR", "SW", "中文"] },
  { n: "03", icon: Store, label: "Distribute", tint: "hsl(38 92% 58%)", chips: ["Marketplace", "KDP", "IngramSpark", "Apple"] },
  { n: "04", icon: GraduationCap, label: "Teach", tint: "hsl(160 84% 45%)", chips: ["Curricula", "Lessons", "Workbooks", "Exams"] },
  { n: "05", icon: Landmark, label: "Institutionalize", tint: "hsl(262 83% 68%)", chips: ["Publishers", "Schools", "NGOs", "Ministries"] },
];

const Connector = () => (
  <svg className="hidden h-3 flex-1 md:block" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden>
    <line x1="0" y1="2" x2="100" y2="2" stroke="hsl(0 0% 100% / 0.12)" strokeWidth="1.5" />
    <line x1="0" y1="2" x2="100" y2="2" stroke="hsl(217 91% 66%)" strokeWidth="1.5" strokeDasharray="2 8" className="animate-flow" />
  </svg>
);

const GlobalKnowledgeNetwork = () => (
  <section className="relative overflow-hidden text-white" style={{ background: "radial-gradient(120% 90% at 50% -10%, hsl(222 47% 11%) 0%, hsl(222 47% 7%) 50%, hsl(224 60% 4%) 100%)" }}>
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-1/4 top-0 h-72 w-72 animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/18 blur-[120px]" />
      <div className="absolute right-1/4 top-10 h-72 w-72 animate-glow-pulse rounded-full bg-[hsl(262_83%_58%)]/18 blur-[120px]" style={{ animationDelay: "2s" }} />
    </div>
    {/* Thread continuing from the hero's overture — the eye flows into the network */}
    <div className="pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center" aria-hidden>
      <div className="h-12 w-px bg-gradient-to-b from-transparent to-white/25" />
      <span className="-mt-1 h-2 w-2 rounded-full bg-[hsl(217_91%_66%)] shadow-[0_0_12px_2px_hsl(217_91%_66%/0.5)]" />
    </div>

    <div className="container relative px-6 py-20 md:py-28">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-[hsl(217_91%_72%)]">One connected system</p>
        <h2 className="text-display mt-3 text-3xl font-bold md:text-[2.7rem]">The global knowledge network</h2>
        <p className="mt-4 text-lg text-white/55 font-sans text-pretty">The five stages above, drawn as one living pipeline: a single idea becomes a book, a localized edition, a marketplace listing, a classroom resource — and an institution's catalog.</p>
      </motion.div>

      {/* Icon rail with flowing connectors */}
      <div className="mx-auto mt-14 hidden max-w-5xl items-center md:flex">
        {STAGES.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center last:flex-none">
            <motion.span
              initial={{ scale: 0.7, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl backdrop-blur"
            >
              <s.icon className="h-6 w-6" style={{ color: s.tint }} />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(222_47%_9%)] font-mono text-[10px] font-bold text-white/70 ring-1 ring-white/15">{s.n}</span>
            </motion.span>
            {i < STAGES.length - 1 && <Connector />}
          </div>
        ))}
      </div>

      {/* Stage columns */}
      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-5 md:gap-2">
        {STAGES.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="text-center md:px-1"
          >
            <div className="mb-3 flex items-center justify-center gap-2 md:hidden">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                <s.icon className="h-4 w-4" style={{ color: s.tint }} />
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(222_47%_9%)] font-mono text-[9px] font-bold text-white/70 ring-1 ring-white/15">{s.n}</span>
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="hidden font-mono text-xs text-white/35 md:inline">{s.n}</span>
              <div className="font-serif text-base font-bold text-white">{s.label}</div>
            </div>
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              {s.chips.map((c) => (
                <span key={c} className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/65 font-sans">{c}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background" />
  </section>
);

export default GlobalKnowledgeNetwork;
