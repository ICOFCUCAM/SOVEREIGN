import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookHeart, Sparkles, Palette, GraduationCap, PencilRuler, NotebookPen, School, BookOpenCheck, Presentation, Globe, ImagePlus, ClipboardCheck, ClipboardList, Layers, ArrowRight, Crown } from "lucide-react";

interface Product {
  name: string;
  description: string;
  icon: typeof BookHeart;
  path: string;
  note?: string;
  plan?: "creator" | "professional";
}

interface Group {
  label: string;
  description: string;
  text: string;   // accent text colour class
  bg: string;     // accent bg class
  dot: string;    // accent dot bg class
  products: Product[];
}

// Grouped by audience/purpose so the studio reads as a structured operating
// system rather than a wall of tiles. Each group is a colour-coded "track".
const GROUPS: Group[] = [
  {
    label: "Children's publishing",
    description: "Illustrated books, series and personalised stories",
    text: "text-publishing", bg: "bg-publishing/10", dot: "bg-publishing",
    products: [
      { name: "Storybook Creator", description: "Complete illustrated picture book tuned to a child's age and reading level — story, illustrations, cover and printable PDF.", icon: BookHeart, path: "/storybook", plan: "creator" },
      { name: "Series Creator", description: "Build a book series in one shared universe — characters, setting and objective carried across Book 1, Book 2, Book 3.", icon: Layers, path: "/series", plan: "creator" },
      { name: "Personalized Books", description: "Make the child the hero. 'James and the Lost Forest.' Add the child's name in the Storybook Creator.", icon: Sparkles, path: "/storybook", note: "In Storybook Creator", plan: "creator" },
      { name: "Coloring Books", description: "Black-and-white line-art pages from any theme, ready to print and colour.", icon: Palette, path: "/coloring", plan: "creator" },
    ],
  },
  {
    label: "Classroom & curriculum",
    description: "Complete teacher and student resources, aligned to any curriculum",
    text: "text-educational", bg: "bg-educational/10", dot: "bg-educational",
    products: [
      { name: "Classroom Packs", description: "Grade + subject + topic → student book, workbook, teacher guide, quiz and answer key — complete in one run.", icon: NotebookPen, path: "/classroom", plan: "professional" },
      { name: "Primary School Book Factory", description: "Maths, English, French, Science, History — textbook, workbook, teacher guide, exam and marking guide.", icon: School, path: "/primary-books", plan: "professional" },
      { name: "Curriculum Builder", description: "Country + grade + subject + term → scheme of work, weekly plan, lesson plan, objectives and assessment.", icon: GraduationCap, path: "/curriculum", plan: "professional" },
      { name: "Teacher Resource Center", description: "One topic → lesson notes, worksheet, quiz, exam and marking guide — a full teacher's kit per topic.", icon: Presentation, path: "/teacher", plan: "professional" },
    ],
  },
  {
    label: "Assessment & practice",
    description: "Workbooks, exams and reusable question banks",
    text: "text-primary", bg: "bg-primary/10", dot: "bg-primary",
    products: [
      { name: "Workbook Generator", description: "Practice, activity, revision, exam-prep and homework packs with the exercise types you choose.", icon: PencilRuler, path: "/workbooks", plan: "professional" },
      { name: "Educational Readers", description: "Leveled reading, vocabulary and first science / geography readers by age band.", icon: BookOpenCheck, path: "/edu-readers", plan: "professional" },
      { name: "Exam & Assessment Pack", description: "Full assessment kit — objectives, exam-prep, the exam itself, marking guide and grading rubric.", icon: ClipboardCheck, path: "/assessment", plan: "professional" },
      { name: "Assessment Bank", description: "A reusable library of quizzes, exams and worksheets organised by subject and grade — adapt across terms.", icon: ClipboardList, path: "/assessment-bank", plan: "professional" },
    ],
  },
  {
    label: "Global & multilingual",
    description: "Translate and publish in any language or culture",
    text: "text-marketplace", bg: "bg-marketplace/10", dot: "bg-marketplace",
    products: [
      { name: "Translate & Localize", description: "Create once, then publish in any language — faithful translation or a culturally adapted edition.", icon: Globe, path: "/translate", plan: "professional" },
      { name: "Illustration Studio", description: "Diagrams, science visuals, geography scenes, posters and line art — saved to your Library to reuse.", icon: ImagePlus, path: "/illustrations", plan: "creator" },
    ],
  },
];

// The teaching pathway — how a full course comes together, end to end.
const PATHWAY: { label: string; icon: typeof GraduationCap; to: string }[] = [
  { label: "Plan curriculum", icon: GraduationCap, to: "/curriculum" },
  { label: "Create lessons", icon: NotebookPen, to: "/classroom" },
  { label: "Build practice", icon: PencilRuler, to: "/workbooks" },
  { label: "Assess", icon: ClipboardCheck, to: "/assessment" },
  { label: "Publish & localize", icon: Globe, to: "/translate" },
];

const PLAN_LABEL: Record<string, string> = { creator: "Creator+", professional: "Professional+" };

const STATS = [
  { v: "14", l: "studios" },
  { v: "Any", l: "grade & subject" },
  { v: "40+", l: "languages" },
  { v: "Any", l: "curriculum" },
];

const ChildrenStudio = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Command hero */}
      <section className="relative overflow-hidden text-white" style={{ background: "radial-gradient(120% 90% at 50% -10%, hsl(222 47% 12%) 0%, hsl(222 47% 7%) 45%, hsl(224 60% 4%) 100%)" }}>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 left-1/4 h-[26rem] w-[26rem] animate-glow-pulse rounded-full bg-[hsl(160_84%_40%)]/22 blur-[120px]" />
          <div className="absolute -top-16 right-1/4 h-[22rem] w-[22rem] animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/22 blur-[120px]" style={{ animationDelay: "2s" }} />
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(160_84%_50%)]/60 to-transparent" />
        <div className="container relative max-w-5xl px-6 pb-12 pt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
            <GraduationCap className="h-4 w-4 text-[hsl(160_84%_55%)]" />
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Educational workspace</span>
          </div>
          <h1 className="text-display mt-4 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            The curriculum <span className="bg-gradient-to-r from-[hsl(160_84%_60%)] via-[hsl(190_84%_64%)] to-[hsl(217_91%_72%)] bg-clip-text italic text-transparent">operating system</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-white/55 font-sans">Plan, teach, assess and publish — whole courses for any grade, subject and language, from one workspace.</p>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="bg-[hsl(222_47%_8%)] px-4 py-4 text-center">
                <div className="font-serif text-2xl font-bold text-white">{s.v}</div>
                <div className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-white/45">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background" />
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Teaching pathway */}
        <section>
          <div className="flex items-baseline gap-2">
            <Layers className="h-4 w-4 text-educational" />
            <h2 className="font-serif text-xl font-bold">The teaching pathway</h2>
            <span className="text-xs text-muted-foreground font-sans">plan → publish</span>
          </div>
          <div className="relative mt-5 overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-2">
              {PATHWAY.map((s, i) => (
                <div key={s.label} className="flex items-center gap-2">
                  <Link to={s.to} className="group flex w-32 flex-col items-center rounded-xl border border-border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-educational/50 hover:shadow-e2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-educational/10 text-educational transition-colors group-hover:bg-educational group-hover:text-white">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <span className="mt-2 text-xs font-semibold font-sans">{s.label}</span>
                  </Link>
                  {i < PATHWAY.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tracks */}
        <div className="mt-12 space-y-10">
          {GROUPS.map((group, gi) => (
            <section key={group.label}>
              <div className="mb-4 flex items-center gap-2.5">
                <span className={`h-7 w-1 rounded-full ${group.dot}`} />
                <div>
                  <h2 className="font-serif text-lg font-bold">{group.label}</h2>
                  <p className="text-sm text-muted-foreground font-sans">{group.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.products.map((p, i) => (
                  <motion.div key={p.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: gi * 0.03 + i * 0.03 }}>
                    <Link to={p.path} className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-e3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${group.bg}`}>
                          <p.icon className={`h-5 w-5 ${group.text}`} />
                        </span>
                        <div className="flex flex-wrap justify-end gap-1">
                          {p.note && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{p.note}</span>}
                          {p.plan && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                              <Crown className="h-2.5 w-2.5" /> {PLAN_LABEL[p.plan]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 font-serif text-base font-semibold">{p.name}</div>
                      <p className="mt-1 flex-1 text-sm text-muted-foreground font-sans">{p.description}</p>
                      <span className={`mt-4 inline-flex items-center text-sm font-medium font-sans ${group.text}`}>
                        Open <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChildrenStudio;
