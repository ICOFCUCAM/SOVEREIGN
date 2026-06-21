import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { KeyRound, Download, Lock, Accessibility as A11y, Globe, FileCheck, ShieldCheck, ArrowRight } from "lucide-react";

// Institutional trust, given the gravitas it deserves: a dark band that reads as
// infrastructure, with the concrete assurances a ministry, district or
// university procurement team checks. Every signal is a real, linked commitment
// (see /security) — no fabricated badges.
const SIGNALS = [
  { icon: KeyRound, label: "Own your content", sub: "Full rights, always yours" },
  { icon: Download, label: "Export forever", sub: "EPUB, PDF, DOCX — no lock-in" },
  { icon: Lock, label: "Private by default", sub: "Row-level isolation" },
  { icon: A11y, label: "Accessibility compliant", sub: "Built to WCAG 2.1 AA" },
  { icon: Globe, label: "Multi-language ready", sub: "40+ languages, any market" },
  { icon: FileCheck, label: "Procurement friendly", sub: "Annual licensing, DPA, SSO" },
];

const EnterpriseBand = () => (
  <section className="relative overflow-hidden bg-background py-20 md:py-28">
    <div className="container px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 px-8 py-14 text-white md:px-14 md:py-16"
        style={{ background: "radial-gradient(120% 120% at 50% -20%, hsl(222 47% 13%) 0%, hsl(222 47% 7%) 55%, hsl(224 60% 4%) 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-24 left-1/4 h-72 w-72 animate-glow-pulse rounded-full bg-[hsl(217_91%_60%)]/22 blur-[110px]" />
          <div className="absolute -bottom-24 right-1/4 h-72 w-72 animate-glow-pulse rounded-full bg-[hsl(160_84%_45%)]/18 blur-[110px]" style={{ animationDelay: "2s" }} />
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(217_91%_64%)]/60 to-transparent" />

        <div className="relative z-10">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow text-[hsl(217_91%_72%)]">For institutions</p>
              <h2 className="text-display mt-2 text-3xl font-bold md:text-[2.5rem]">Trusted for institutional publishing</h2>
            </div>
            <Link to="/security" className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10">
              <ShieldCheck className="h-4 w-4 text-[hsl(217_91%_72%)]" /> Security &amp; Governance
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {SIGNALS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <s.icon className="h-5 w-5 text-[hsl(217_91%_72%)]" />
                </span>
                <div>
                  <div className="font-sans text-sm font-semibold text-white">{s.label}</div>
                  <div className="font-sans text-xs text-white/50">{s.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default EnterpriseBand;
