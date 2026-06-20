import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Briefcase, BookOpen, GraduationCap, Store, ArrowRight } from "lucide-react";

// The four product pillars, stated plainly so a first-time visitor understands
// this is a platform — career, publishing, education and a marketplace — not a
// single generator.
const PILLARS = [
  {
    icon: Briefcase,
    name: "Career Studio",
    blurb: "Land the interview with AI-built, ATS-ready documents.",
    items: ["CV Builder", "Tailor to a Job", "Cover Letters"],
    to: "/cv",
    text: "text-career", bg: "bg-career/10", border: "hover:border-career/50",
    glow: "group-hover:shadow-[0_0_32px_0_hsl(var(--career)/0.25)]",
    iconGlow: "group-hover:shadow-[0_0_16px_0_hsl(var(--career)/0.4)]",
  },
  {
    icon: BookOpen,
    name: "Publishing Studio",
    blurb: "Write, illustrate and produce full books, print-ready.",
    items: ["Book Creator", "Transform a Book", "Illustration Studio", "Covers & export"],
    to: "/book",
    text: "text-publishing", bg: "bg-publishing/10", border: "hover:border-publishing/50",
    glow: "group-hover:shadow-[0_0_32px_0_hsl(var(--publishing)/0.25)]",
    iconGlow: "group-hover:shadow-[0_0_16px_0_hsl(var(--publishing)/0.4)]",
  },
  {
    icon: GraduationCap,
    name: "Educational Studio",
    blurb: "14 tools for children's publishing, classrooms and curricula in any language.",
    items: ["Storybooks & series", "Classroom packs & primary books", "Curriculum builder", "Exams, workbooks & assessment banks"],
    to: "/children",
    text: "text-educational", bg: "bg-educational/10", border: "hover:border-educational/50",
    glow: "group-hover:shadow-[0_0_32px_0_hsl(var(--educational)/0.25)]",
    iconGlow: "group-hover:shadow-[0_0_16px_0_hsl(var(--educational)/0.4)]",
  },
  {
    icon: Store,
    name: "Marketplace",
    blurb: "Publish, get discovered, and sell to readers and schools.",
    items: ["Discover & trending", "Author pages", "Categories", "Distribution"],
    to: "/catalog",
    text: "text-marketplace", bg: "bg-marketplace/10", border: "hover:border-marketplace/50",
    glow: "group-hover:shadow-[0_0_32px_0_hsl(var(--marketplace)/0.25)]",
    iconGlow: "group-hover:shadow-[0_0_16px_0_hsl(var(--marketplace)/0.4)]",
  },
];

const PillarsSection = () => (
  <section className="py-24 bg-background border-t border-border/40">
    <div className="container px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
          One platform, <span className="text-gradient-gold italic">four studios</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-sans">
          Create professional documents, full books and educational content — then publish, translate and sell them, all in one place.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Link to={p.to} className={`group flex h-full flex-col rounded-2xl border border-border bg-gradient-to-br from-card to-background p-6 shadow-premium transition-all duration-300 hover:-translate-y-1 ${p.border} ${p.glow}`}>
              <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-shadow duration-300 ${p.bg} ${p.iconGlow}`}>
                <p.icon className={`h-6 w-6 ${p.text} transition-transform duration-200 group-hover:scale-110`} />
              </span>
              <h3 className="font-serif text-xl font-bold">{p.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground font-sans">{p.blurb}</p>
              <ul className="mt-4 flex-1 space-y-1.5">
                {p.items.map((it) => (
                  <li key={it} className="text-sm text-foreground/80 font-sans">{it}</li>
                ))}
              </ul>
              <span className={`mt-5 inline-flex items-center text-sm font-medium font-sans ${p.text}`}>
                Explore <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PillarsSection;
