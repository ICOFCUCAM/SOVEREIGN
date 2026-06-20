import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, BookOpen, GraduationCap, Store, Sparkles, Globe, Layers } from "lucide-react";
import { Link } from "react-router-dom";

// The four pillars, shown as the platform's identity rather than a single tool.
const PILLARS = [
  { label: "Career", color: "bg-career" },
  { label: "Publishing", color: "bg-publishing" },
  { label: "Education", color: "bg-educational" },
  { label: "Marketplace", color: "bg-marketplace" },
];

// The publishing lifecycle the platform runs end to end — the heart of the
// "operating system" positioning.
const LIFECYCLE = ["Create", "Publish", "Localize", "Distribute", "Sell"];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Abstract four-pillar background — no document imagery */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-career/20 blur-3xl" />
        <div className="absolute -top-24 right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-publishing/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[10%] h-[26rem] w-[26rem] rounded-full bg-educational/15 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[6%] h-[24rem] w-[24rem] rounded-full bg-marketplace/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Brand accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient opacity-70" />

      <div className="container relative z-10 px-6 py-20">
        {/* Floating feature cards — positioned absolutely to add visual depth */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
          className="absolute left-4 top-1/3 hidden xl:flex flex-col gap-2 -translate-y-1/2">
          {[
            { icon: FileText, label: "CV Builder", color: "text-career", bg: "bg-career/10" },
            { icon: BookOpen, label: "Book Creator", color: "text-publishing", bg: "bg-publishing/10" },
            { icon: Globe, label: "Translate & Localize", color: "text-educational", bg: "bg-educational/10" },
          ].map((c) => (
            <div key={c.label} className={`flex items-center gap-2 rounded-xl border border-border ${c.bg} px-3 py-2 backdrop-blur-sm shadow-premium`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs font-medium font-sans text-foreground/80">{c.label}</span>
            </div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute right-4 top-1/3 hidden xl:flex flex-col gap-2 -translate-y-1/2">
          {[
            { icon: GraduationCap, label: "Educational Studio", color: "text-educational", bg: "bg-educational/10" },
            { icon: Store, label: "Marketplace", color: "text-marketplace", bg: "bg-marketplace/10" },
            { icon: Layers, label: "14 tools", color: "text-primary", bg: "bg-primary/10" },
          ].map((c) => (
            <div key={c.label} className={`flex items-center gap-2 rounded-xl border border-border ${c.bg} px-3 py-2 backdrop-blur-sm shadow-premium`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs font-medium font-sans text-foreground/80">{c.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto text-center">
          {/* Four-pillar badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-border bg-card/70 px-4 py-1.5 mb-8 backdrop-blur">
            {PILLARS.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 font-sans">
                <span className={`h-1.5 w-1.5 rounded-full ${p.color}`} /> {p.label}
              </span>
            ))}
          </div>

          <h1 className="text-display text-4xl md:text-6xl font-bold leading-[1.1] mb-6 text-foreground">
            The operating system for <span className="text-gradient-gold italic">publishing &amp; educational creation</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-sans text-pretty">
            Create CVs, books, storybooks, workbooks and curricula with AI — then localize into any language, publish to KDP and IngramSpark, and sell in a global marketplace. One platform, the whole journey.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Button variant="hero" size="lg" className="text-base px-8 py-6 shadow-premium" asChild>
                <Link to="/dashboard"><Sparkles className="w-5 h-5 mr-2 animate-pulse" />Start creating free <ArrowRight className="w-5 h-5 ml-1" /></Link>
              </Button>
            </motion.div>
            <Button variant="heroOutline" size="lg" className="text-base px-8 py-6" asChild>
              <Link to="/catalog">Explore the marketplace</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground font-sans">No card required · You own what you create · Cancel anytime</p>
        </motion.div>

        {/* Lifecycle strip — the five stages the platform runs end to end. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-14 max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-border pt-8"
        >
          {LIFECYCLE.map((stage, i) => (
            <span key={stage} className="inline-flex items-center gap-3">
              <span className="text-sm font-semibold tracking-tight text-foreground font-sans">{stage}</span>
              {i < LIFECYCLE.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
