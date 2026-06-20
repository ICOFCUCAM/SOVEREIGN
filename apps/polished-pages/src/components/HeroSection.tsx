import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, BookOpen, GraduationCap, Store } from "lucide-react";
import { Link } from "react-router-dom";

// The four pillars, shown as the platform's identity rather than a single tool.
const PILLARS = [
  { label: "Career", color: "bg-career" },
  { label: "Publishing", color: "bg-publishing" },
  { label: "Education", color: "bg-educational" },
  { label: "Marketplace", color: "bg-marketplace" },
];

const CAPABILITIES = [
  { icon: FileText, label: "Professional CVs", color: "text-career" },
  { icon: BookOpen, label: "Books & publishing", color: "text-publishing" },
  { icon: GraduationCap, label: "Educational content", color: "text-educational" },
  { icon: Store, label: "Marketplace distribution", color: "text-marketplace" },
];

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
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto text-center">
          {/* Four-pillar badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-border bg-card/70 px-4 py-1.5 mb-8 backdrop-blur">
            {PILLARS.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 font-sans">
                <span className={`h-1.5 w-1.5 rounded-full ${p.color}`} /> {p.label}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-foreground">
            Create, publish and distribute <span className="text-gradient-gold italic">documents, books and educational content</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            The AI platform for career, publishing and education. Build CVs, books, children’s storybooks, workbooks and curricula — then translate into any language, publish to KDP and IngramSpark, and sell in the marketplace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="text-base px-8 py-6" asChild>
              <Link to="/dashboard">Start creating free <ArrowRight className="w-5 h-5 ml-1" /></Link>
            </Button>
            <Button variant="heroOutline" size="lg" className="text-base px-8 py-6" asChild>
              <Link to="/catalog">Explore the marketplace</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground font-sans">No card required · You own what you create · Cancel anytime</p>
        </motion.div>

        {/* Capability strip (real capabilities, not vanity metrics) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-14 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-border pt-8"
        >
          {CAPABILITIES.map((c) => (
            <div key={c.label} className="inline-flex items-center gap-2 text-sm text-muted-foreground font-sans">
              <c.icon className={`h-4 w-4 ${c.color}`} /> {c.label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
