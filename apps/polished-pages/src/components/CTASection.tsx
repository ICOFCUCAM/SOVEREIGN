import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

// Closing stage — the dark bookend to the hero, so the page opens and closes on
// the same premium note. No stock photography; the depth comes from the brand
// gradient and light.
const CTASection = () => {
  const { t } = useI18n();
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 px-8 py-16 text-center text-white md:px-20 md:py-24"
          style={{ background: "radial-gradient(120% 120% at 50% -20%, hsl(222 47% 13%) 0%, hsl(222 47% 7%) 50%, hsl(224 60% 4%) 100%)" }}
        >
          {/* Ambient brand glows */}
          <div className="pointer-events-none absolute inset-0 -z-0">
            <div className="absolute -top-24 left-1/3 h-72 w-72 animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/30 blur-[100px]" />
            <div className="absolute -bottom-24 right-1/4 h-72 w-72 animate-glow-pulse rounded-full bg-[hsl(262_83%_58%)]/30 blur-[100px]" style={{ animationDelay: "2s" }} />
          </div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(262_83%_64%)]/60 to-transparent" />

          <div className="relative z-10">
            <h2 className="text-display mx-auto max-w-2xl text-3xl font-bold md:text-5xl">{t("cta.heading")}</h2>
            <p className="mx-auto mt-5 max-w-md text-lg font-medium text-white/55 font-sans">{t("hero.tagline")}</p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] px-8 py-3.5 text-base font-semibold text-white shadow-[0_12px_40px_-8px_hsl(248_83%_55%/0.7)]"
                >
                  <Sparkles className="h-5 w-5" /> {t("hero.ctaPrimary")}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10"
              >
                {t("cta.seePricing")}
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/40 font-sans">{t("hero.trust")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
