import { motion } from "framer-motion";
import { PenLine, Send, Languages, Share2, ShoppingBag, Check, TrendingUp } from "lucide-react";
import BookCover from "./BookCover";

// A crafted "Studio" product surface — the platform shown operating, not
// described. One frame carries the whole story: a book being written, localized
// into six languages, and going live in the marketplace with real reader
// momentum. Everything is drawn (CSS/SVG), so it stays crisp at any scale and
// needs no stock imagery.

const STEPS = [
  { icon: PenLine, label: "Create", active: true },
  { icon: Send, label: "Publish" },
  { icon: Languages, label: "Localize" },
  { icon: Share2, label: "Distribute" },
  { icon: ShoppingBag, label: "Sell" },
];

const LANGS = [
  { code: "EN", active: true },
  { code: "ES" }, { code: "FR" }, { code: "SW" }, { code: "العربية" }, { code: "中文" },
];

// A small upward-trending sparkline (drawn, not charted).
const Sparkline = () => (
  <svg viewBox="0 0 120 36" className="h-9 w-full" preserveAspectRatio="none" aria-hidden>
    <defs>
      <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(160 84% 45%)" stopOpacity="0.35" />
        <stop offset="100%" stopColor="hsl(160 84% 45%)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M2 30 L20 27 L38 28 L56 20 L74 22 L92 12 L118 5" fill="none" stroke="hsl(160 84% 50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 30 L20 27 L38 28 L56 20 L74 22 L92 12 L118 5 L118 36 L2 36 Z" fill="url(#spark)" />
  </svg>
);

const HeroShowcase = () => {
  return (
    <div className="relative">
      {/* Glow behind the surface */}
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_40%,hsl(221_83%_53%/0.35),transparent_70%)] blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 28, rotateX: 6 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 1200 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[11px] font-medium tracking-tight text-white/45">Polished Pages — Studio</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
          </span>
        </div>

        <div className="grid grid-cols-[64px_1fr] gap-0">
          {/* Lifecycle rail */}
          <div className="flex flex-col items-stretch gap-1 border-r border-white/10 p-2.5">
            {STEPS.map((s) => (
              <div
                key={s.label}
                className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-center ${s.active ? "bg-white/10" : ""}`}
              >
                <s.icon className={`h-4 w-4 ${s.active ? "text-white" : "text-white/40"}`} />
                <span className={`text-[8.5px] font-medium ${s.active ? "text-white/90" : "text-white/35"}`}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Working canvas */}
          <div className="p-4">
            <div className="flex gap-4">
              <div className="w-[88px] shrink-0">
                <BookCover spec={{ title: "The Atlas of Tomorrow", author: "A. Okonkwo", tag: "Fiction", from: "hsl(262 83% 58%)", to: "hsl(221 83% 40%)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-tight text-white">The Atlas of Tomorrow</div>
                <div className="mt-0.5 text-[10px] text-white/45">Chapter 7 · drafting</div>
                {/* Writing-in-progress lines */}
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 w-full rounded-full bg-white/15" />
                  <div className="h-1.5 w-[92%] rounded-full bg-white/12" />
                  <div className="h-1.5 w-[97%] rounded-full bg-white/12" />
                  <div className="relative h-1.5 w-[60%] overflow-hidden rounded-full bg-white/10">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ backgroundSize: "400px 100%" }} />
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
                  <PenLine className="h-3 w-3" /> AI is writing…
                </div>
              </div>
            </div>

            {/* Localization row */}
            <div className="mt-4 flex items-center gap-1.5 border-t border-white/10 pt-3">
              <Languages className="mr-0.5 h-3.5 w-3.5 text-white/40" />
              {LANGS.map((l) => (
                <span
                  key={l.code}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${l.active ? "bg-white text-slate-900" : "bg-white/10 text-white/55"}`}
                >
                  {l.code}
                </span>
              ))}
              <span className="text-[9px] font-medium text-white/35">+38</span>
            </div>

            {/* Marketplace + momentum */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium uppercase tracking-wide text-white/40">In the store</span>
                  <ShoppingBag className="h-3 w-3 text-white/40" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[15px] font-bold text-white">$9.99</span>
                  <span className="text-[9px] font-semibold text-emerald-300">Live</span>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium uppercase tracking-wide text-white/40">Readers / wk</span>
                  <TrendingUp className="h-3 w-3 text-emerald-300" />
                </div>
                <Sparkline />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating accent — publish success */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute -right-3 top-10 animate-drift sm:-right-6"
      >
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 shadow-2xl backdrop-blur-xl">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20">
            <Check className="h-3.5 w-3.5 text-emerald-300" />
          </span>
          <div className="leading-tight">
            <div className="text-[10px] font-semibold text-white">Published to Wankong</div>
            <div className="text-[9px] text-white/45">Global marketplace · 41 languages</div>
          </div>
        </div>
      </motion.div>

      {/* Floating accent — reach */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -left-3 bottom-8 animate-drift sm:-left-6"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 shadow-2xl backdrop-blur-xl">
          <div className="text-[9px] font-medium uppercase tracking-wide text-white/40">Sold in</div>
          <div className="mt-0.5 text-[13px] font-bold text-white">120+ countries</div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroShowcase;
