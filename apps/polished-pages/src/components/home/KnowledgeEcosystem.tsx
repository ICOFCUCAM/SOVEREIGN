import { motion } from "framer-motion";
import { BookOpen, GraduationCap, ClipboardCheck, BookHeart, Languages, Building2, School, Landmark } from "lucide-react";
import SpineMark from "@/components/brand/SpineMark";

// "One connected ecosystem" — the moment the page reveals that books, curricula,
// assessments, translations, publishers, schools and ministries are all
// manifestations of one thing: knowledge assets, flowing through one network.
// A dark, dramatic band that breaks the white-desert rhythm and carries the
// category narrative.
const NODES = [
  { label: "Books", icon: BookOpen },
  { label: "Curricula", icon: GraduationCap },
  { label: "Assessments", icon: ClipboardCheck },
  { label: "Storybooks", icon: BookHeart },
  { label: "Translations", icon: Languages },
  { label: "Publishers", icon: Building2 },
  { label: "Schools", icon: School },
  { label: "Ministries", icon: Landmark },
];

// 8 compass positions on a circle (radius 42% from centre) — the SVG connectors
// are drawn to the same coordinates so the lines actually meet the nodes.
const pts = NODES.map((_, i) => {
  const a = (-90 + i * 45) * (Math.PI / 180);
  return { x: 50 + 42 * Math.cos(a), y: 50 + 42 * Math.sin(a) };
});

const KnowledgeEcosystem = () => (
  <section className="relative overflow-hidden text-white" style={{ background: "radial-gradient(120% 100% at 50% -10%, hsl(222 47% 12%) 0%, hsl(222 47% 7%) 55%, hsl(224 60% 4%) 100%)" }}>
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-1/4 top-10 h-72 w-72 animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/18 blur-[120px]" />
      <div className="absolute right-1/4 top-0 h-72 w-72 animate-glow-pulse rounded-full bg-[hsl(262_83%_58%)]/18 blur-[120px]" style={{ animationDelay: "2s" }} />
    </div>
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(217_91%_64%)]/50 to-transparent" />

    <div className="container px-6 py-24 md:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="font-mono text-sm font-bold tabular-nums text-white/40">05</span>
          <span className="h-px w-8 bg-white/20" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">Institutionalize</span>
        </div>
        <p className="eyebrow text-white/60">One network</p>
        <h2 className="text-display mt-4 text-3xl font-bold md:text-5xl">
          Every output is a <span className="bg-gradient-to-r from-[hsl(217_91%_72%)] via-[hsl(190_84%_70%)] to-[hsl(160_84%_62%)] bg-clip-text italic text-transparent">knowledge asset</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/55 font-sans">
          Books, curricula, assessments and translations — created by authors, schools, publishers and ministries — are all the same thing, flowing through one connected network.
        </p>
      </div>

      {/* Constellation (md+) — nodes wired to a glowing core */}
      <div className="relative mx-auto mt-14 hidden aspect-square w-full max-w-2xl md:block">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {pts.map((p, i) => (
            <g key={i}>
              <line x1="50" y1="50" x2={p.x} y2={p.y} stroke="hsl(0 0% 100% / 0.12)" strokeWidth="0.4" />
              <line x1="50" y1="50" x2={p.x} y2={p.y} stroke="hsl(217 91% 66%)" strokeWidth="0.4" strokeDasharray="1 6" className="animate-flow" style={{ animationDelay: `${i * 0.25}s` }} />
            </g>
          ))}
        </svg>
        {/* Core */}
        <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-sm">
          <div className="pointer-events-none absolute -inset-4 -z-10 animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/25 blur-2xl" />
          <SpineMark size="sm" animated className="justify-center" />
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">Knowledge</span>
        </div>
        {/* Nodes */}
        {NODES.map((n, i) => (
          <motion.div
            key={n.label}
            initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-white/12 bg-[hsl(222_47%_9%)]/80 px-3 py-1.5 shadow-xl backdrop-blur-sm"
            style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%` }}
          >
            <n.icon className="h-3.5 w-3.5 text-[hsl(217_91%_72%)]" />
            <span className="text-xs font-semibold text-white/90 font-sans">{n.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Mobile fallback — the same assets, wrapped */}
      <div className="mt-10 flex flex-wrap justify-center gap-2 md:hidden">
        {NODES.map((n) => (
          <span key={n.label} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/90 font-sans">
            <n.icon className="h-3.5 w-3.5 text-[hsl(217_91%_72%)]" /> {n.label}
          </span>
        ))}
      </div>
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background" />
  </section>
);

export default KnowledgeEcosystem;
