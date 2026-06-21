import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ctaImage from "@/assets/cta-workspace.jpg";
import { useI18n } from "@/lib/i18n";

const CTASection = () => {
  const { t } = useI18n();
  return (
    <section className="py-16 md:py-24 bg-hero-gradient">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto rounded-2xl border border-border overflow-hidden shadow-premium"
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src={ctaImage}
              alt="Creative workspace"
              className="w-full h-full object-cover opacity-20"
              loading="lazy"
              width={1600}
              height={800}
            />
            <div className="absolute inset-0 bg-background/80" />
          </div>

          <div className="absolute inset-x-0 top-0 z-10 h-[2px] bg-gold-gradient opacity-80" />
          <div className="relative z-10 p-12 md:p-20 text-center">
            <h2 className="text-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
              {t("cta.heading")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 font-sans text-pretty">
              {t("cta.sub")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                <Button variant="hero" size="lg" className="text-base px-10 py-6 shadow-premium" asChild>
                  <Link to="/dashboard">{t("hero.ctaPrimary")} <ArrowRight className="w-5 h-5 ml-1" /></Link>
                </Button>
              </motion.div>
              <Button variant="heroOutline" size="lg" className="text-base px-10 py-6" asChild>
                <Link to="/pricing">{t("cta.seePricing")}</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground font-sans">{t("hero.trust")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
