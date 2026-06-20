import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, BookOpen, GraduationCap, Store, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { STUDIO_THEME, type Studio } from "@/lib/studio-theme";

// Premium first-run experience for a brand-new account, so the dashboard is a
// confident launchpad rather than a wall of empty "0" cards.
const STARTERS: { studio: Studio; icon: typeof Briefcase; title: string; desc: string; to: string; cta: string }[] = [
  { studio: "career", icon: Briefcase, title: "Land the interview", desc: "Build an ATS-ready CV and a matching cover letter.", to: "/cv", cta: "Create a CV" },
  { studio: "publishing", icon: BookOpen, title: "Publish a book", desc: "Outline, write and illustrate a full book, print-ready.", to: "/book", cta: "Create a book" },
  { studio: "educational", icon: GraduationCap, title: "Teach the world", desc: "Storybooks, workbooks, curricula and assessments.", to: "/children", cta: "Open the studio" },
  { studio: "marketplace", icon: Store, title: "Get discovered", desc: "Publish your work and sell to readers and schools.", to: "/catalog", cta: "Explore the marketplace" },
];

const GettingStarted = () => (
  <section className="mt-8">
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-background">
      <CardContent className="p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary font-sans">Welcome to your studio</span>
        </div>
        <h2 className="font-serif text-2xl font-bold tracking-tight">Pick a starting point</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground font-sans">
          Create across four studios, then publish, translate and distribute — all from one place. Start anywhere; everything you make is saved to your library.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STARTERS.map((s, i) => {
            const t = STUDIO_THEME[s.studio];
            return (
              <motion.div key={s.to} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link to={s.to} className={`hover-lift group flex h-full flex-col rounded-xl border border-border bg-background/70 p-4 transition-premium ${t.hoverBorder}`}>
                  <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${t.bg}`}><s.icon className={`h-5 w-5 ${t.text}`} /></span>
                  <div className="font-sans text-sm font-semibold">{s.title}</div>
                  <p className="mt-1 flex-1 text-xs text-muted-foreground font-sans">{s.desc}</p>
                  <span className={`mt-3 inline-flex items-center text-sm font-medium font-sans ${t.text}`}>{s.cta} <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-5 text-xs text-muted-foreground font-sans">
          Tip: press <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px]">⌘K</kbd> any time to jump to any tool or action.
        </p>
      </CardContent>
    </Card>
  </section>
);

export default GettingStarted;
