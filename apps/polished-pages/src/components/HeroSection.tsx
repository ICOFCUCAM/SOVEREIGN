import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import LivingGraph from "@/components/home/LivingGraph";
import CatalogWall from "@/components/home/CatalogWall";

// The four pillars, shown as the platform's identity eyebrow.
const PILLARS = [
  { label: "Career", color: "bg-career" },
  { label: "Publishing", color: "bg-publishing" },
  { label: "Education", color: "bg-educational" },
  { label: "Marketplace", color: "bg-marketplace" },
];

// The page's arc, previewed here as an overture and paid off chapter by chapter
// below (01 Create → 05 Institutionalize).
const ARC = ["Create", "Localize", "Distribute", "Teach", "Institutionalize"];

// A dark, cinematic stage. The hero is its own lit room regardless of the site
// theme — the Stripe/Linear/Arc move — so the crafted product surface glows and
// the page reads premium before a sentence is read. Visual proof first, copy
// second.
const HeroSection = () => {
  const { t } = useI18n();
  return (
    <section
      className="relative isolate overflow-hidden text-white"
      style={{ background: "radial-gradient(120% 90% at 50% -10%, hsl(222 47% 12%) 0%, hsl(222 47% 7%) 45%, hsl(224 60% 4%) 100%)" }}
    >
      {/* Ambient brand glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[34rem] w-[34rem] animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/25 blur-[120px]" />
        <div className="absolute top-10 right-[8%] h-[30rem] w-[30rem] animate-glow-pulse rounded-full bg-[hsl(262_83%_58%)]/25 blur-[120px]" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[-12rem] left-[12%] h-[26rem] w-[26rem] animate-glow-pulse rounded-full bg-[hsl(160_84%_40%)]/15 blur-[120px]" style={{ animationDelay: "4s" }} />
      </div>
      {/* Fine grid, faded toward the edges */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(100% 70% at 50% 30%, #000 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(100% 70% at 50% 30%, #000 40%, transparent 100%)",
        }}
      />
      {/* Brand hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(262_83%_64%)]/60 to-transparent" />

      <div className="container relative px-6 pb-16 pt-28 sm:pt-32 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          {/* Copy */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
            <div className="mb-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur">
              {PILLARS.map((p) => (
                <span key={p.label} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/70">
                  <span className={`h-1.5 w-1.5 rounded-full ${p.color}`} /> {p.label}
                </span>
              ))}
            </div>

            <h1 className="text-display text-5xl font-bold sm:text-6xl xl:text-[4.5rem]">
              {t("hero.headlineA")}{" "}
              <span className="bg-gradient-to-r from-[hsl(217_91%_70%)] via-[hsl(245_85%_74%)] to-[hsl(280_85%_74%)] bg-clip-text italic text-transparent">
                {t("hero.headlineB")}
              </span>
            </h1>

            <p className="mt-5 max-w-md text-lg font-medium text-white/55">{t("hero.tagline")}</p>

            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] px-7 py-3.5 text-base font-semibold text-white shadow-[0_12px_40px_-8px_hsl(248_83%_55%/0.7)] transition-transform"
                >
                  <Sparkles className="h-5 w-5" /> {t("hero.ctaPrimary")}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>

            <p className="mt-5 text-xs text-white/40">{t("hero.trust")}</p>
          </motion.div>

          {/* Iconic signature — the living publishing graph */}
          <div className="lg:pl-4">
            <LivingGraph />
          </div>
        </div>

        {/* Living catalog — visual proof of scale, genre and language reach */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="mt-16 lg:mt-24">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">A living catalog</span>
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-medium text-white/40">40+ languages · every genre</span>
          </div>
          <CatalogWall />
        </motion.div>

        {/* Arc overture — the journey a single idea takes, paid off chapter by
            chapter below. Ties the hero into the page's one continuous story. */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="mt-14 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-0">
            {ARC.map((a, i) => (
              <div key={a} className="flex items-center">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  <span className="font-mono text-white/65">{String(i + 1).padStart(2, "0")}</span> {a}
                </span>
                {i < ARC.length - 1 && <ArrowRight className="mx-3 hidden h-3 w-3 text-white/25 sm:block" />}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Seam into the page below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
};

export default HeroSection;
