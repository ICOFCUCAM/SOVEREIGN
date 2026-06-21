import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

// One outcome, one crafted visual. The page's chapters are built from this:
// a confident outcome headline (not a feature list), a single supporting line,
// and a demonstration of the workflow rather than a description of it.
interface Props {
  eyebrow: string;
  eyebrowClass?: string;
  title: ReactNode;
  body: string;
  ctaLabel: string;
  ctaTo: string;
  visual: ReactNode;
  glow?: string; // full CSS color incl. alpha
  reversed?: boolean;
}

const FeatureStage = ({ eyebrow, eyebrowClass = "text-primary", title, body, ctaLabel, ctaTo, visual, glow = "hsl(221 83% 53% / 0.18)", reversed }: Props) => (
  <section className="relative border-t border-border/40 bg-background py-24 md:py-32">
    <div className="container px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={reversed ? "lg:order-2" : ""}
        >
          <p className={`eyebrow ${eyebrowClass}`}>{eyebrow}</p>
          <h2 className="text-display mt-4 text-3xl font-bold text-foreground md:text-[2.9rem]">{title}</h2>
          <p className="mt-4 max-w-md text-lg text-muted-foreground font-sans text-pretty">{body}</p>
          <Link to={ctaTo} className="group mt-7 inline-flex items-center gap-3 text-base font-semibold text-foreground font-sans">
            {ctaLabel}
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border transition-all group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`relative ${reversed ? "lg:order-1" : ""}`}
        >
          <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[2.5rem] blur-3xl" style={{ background: `radial-gradient(55% 55% at 50% 50%, ${glow}, transparent 72%)` }} />
          {visual}
        </motion.div>
      </div>
    </div>
  </section>
);

export default FeatureStage;
