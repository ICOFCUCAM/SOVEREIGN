import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Store, Send, TrendingUp, Check } from "lucide-react";
import CountUp from "@/components/brand/CountUp";

// The Living Publishing Graph — the platform's iconic asset. One manuscript at
// the centre radiating into every language, every distribution channel and the
// readers beyond. Drawn (SVG + CSS), alive (flowing links, a cycling
// translation, ticking reach), and owned by no one else.

const C = 200; // svg centre
const LANGS = [
  { code: "EN", x: 200, y: 108 },
  { code: "ES", x: 280, y: 154 },
  { code: "FR", x: 280, y: 246 },
  { code: "SW", x: 200, y: 292 },
  { code: "العربية", x: 120, y: 246 },
  { code: "中文", x: 120, y: 154 },
];
const NODES = [
  { label: "Schools", icon: GraduationCap, x: 81, y: 81, tint: "hsl(160 84% 45%)" },
  { label: "KDP", icon: Send, x: 319, y: 81, tint: "hsl(221 83% 62%)" },
  { label: "Marketplace", icon: Store, x: 81, y: 319, tint: "hsl(38 92% 56%)" },
  { label: "IngramSpark", icon: Send, x: 319, y: 319, tint: "hsl(262 83% 66%)" },
];
const pct = (v: number) => `${(v / 400) * 100}%`;

const LivingGraph = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % LANGS.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto aspect-square w-full max-w-[460px]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(248_83%_55%/0.35),transparent_70%)] blur-2xl" />

      {/* Connections */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="lg-link" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(221 83% 60%)" />
            <stop offset="100%" stopColor="hsl(262 83% 66%)" />
          </linearGradient>
        </defs>
        {[...LANGS, ...NODES].map((n, i) => (
          <g key={i}>
            <line x1={C} y1={C} x2={n.x} y2={n.y} stroke="hsl(0 0% 100% / 0.08)" strokeWidth="1.5" />
            <line x1={C} y1={C} x2={n.x} y2={n.y} stroke="url(#lg-link)" strokeWidth="1.5" strokeDasharray="2 10" className="animate-flow" style={{ animationDelay: `${i * 0.13}s` }} />
          </g>
        ))}
      </svg>

      {/* Distribution nodes */}
      {NODES.map((n) => (
        <div key={n.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(n.x), top: pct(n.y) }}>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-2.5 py-1.5 shadow-xl backdrop-blur-md">
            <n.icon className="h-3.5 w-3.5" style={{ color: n.tint }} />
            <span className="text-[11px] font-semibold text-white/90">{n.label}</span>
          </div>
        </div>
      ))}

      {/* Language nodes */}
      {LANGS.map((l, i) => {
        const on = i === active;
        return (
          <div key={l.code} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(l.x), top: pct(l.y) }}>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition-all duration-300 ${on ? "scale-110 bg-white text-slate-900 shadow-lg" : "bg-white/10 text-white/60"}`}>
              {on && <Check className="h-3 w-3 text-emerald-500" />}{l.code}
            </span>
          </div>
        );
      })}

      {/* Manuscript core */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-[120px] rounded-2xl border border-white/15 bg-white/[0.07] p-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-[hsl(262_83%_72%)]" />
            <span className="text-[10px] font-semibold text-white/90">Manuscript</span>
          </div>
          <div className="mt-1.5 font-serif text-[12px] font-bold leading-tight text-white">The Atlas of Tomorrow</div>
          <div className="mt-2 space-y-1">
            <div className="h-1 w-full rounded-full bg-white/15" />
            <div className="relative h-1 w-3/4 overflow-hidden rounded-full bg-white/10">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" style={{ backgroundSize: "300px 100%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Live outcomes */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        className="absolute -right-2 top-2 animate-drift">
        <div className="rounded-xl border border-white/10 bg-slate-900/85 px-3 py-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-white/45"><TrendingUp className="h-3 w-3 text-emerald-300" /> Readers / wk</div>
          <div className="font-serif text-base font-bold text-white"><CountUp value={1240} duration={1600} /></div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
        className="absolute -left-2 bottom-3 animate-drift" style={{ animationDelay: "1.4s" }}>
        <div className="rounded-xl border border-white/10 bg-slate-900/85 px-3 py-2 shadow-2xl backdrop-blur-xl">
          <div className="text-[9px] font-medium uppercase tracking-wide text-white/45">Sold in</div>
          <div className="font-serif text-base font-bold text-white"><CountUp value={120} duration={1600} suffix="+" /> <span className="text-[10px] font-normal text-white/50">countries</span></div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LivingGraph;
