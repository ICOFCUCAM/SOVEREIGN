import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookHeart, Sparkles, Palette, GraduationCap, PencilRuler, NotebookPen, School, BookOpenCheck, Presentation, Globe, ImagePlus, ClipboardCheck, ClipboardList, Layers, ArrowRight, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  name: string;
  description: string;
  icon: typeof BookHeart;
  path: string;
  note?: string;
  plan?: "creator" | "professional";
}

// Grouped by audience/purpose so the studio reads as a structured offering
// rather than a wall of tiles.
const GROUPS: { label: string; description: string; products: Product[] }[] = [
  {
    label: "Children's publishing",
    description: "Illustrated books, series and personalised stories",
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
    products: [
      { name: "Translate & Localize", description: "Create once, then publish in any language — faithful translation or a culturally adapted edition.", icon: Globe, path: "/translate", plan: "professional" },
      { name: "Illustration Studio", description: "Diagrams, science visuals, geography scenes, posters and line art — saved to your Library to reuse.", icon: ImagePlus, path: "/illustrations", plan: "creator" },
    ],
  },
];

const PLAN_LABEL: Record<string, string> = {
  creator: "Creator+",
  professional: "Professional+",
};

const ChildrenStudio = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-educational/20 bg-educational/5 px-4 py-1.5 mb-4">
          <BookHeart className="w-4 h-4 text-educational" />
          <span className="text-sm text-educational font-medium font-sans">Educational Publishing Studio</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Publish for <span className="text-gradient-gold italic">every learner</span></h1>
        <p className="mt-2 max-w-2xl text-muted-foreground font-sans">
          Fourteen tools across four categories: illustrated storybooks, full classroom packs, curriculum plans, assessments and multilingual editions — everything a teacher, author or school publisher needs.
        </p>
      </motion.div>

      <div className="mt-8 space-y-10">
        {GROUPS.map((group, gi) => (
          <section key={group.label}>
            <div className="mb-4">
              <h2 className="font-serif text-lg font-bold">{group.label}</h2>
              <p className="text-sm text-muted-foreground font-sans">{group.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.products.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.05 + i * 0.04 }}
                >
                  <Link to={p.path} className="group block h-full">
                    <Card className="h-full border-border transition-all hover:border-primary/50 hover:shadow-premium">
                      <CardContent className="flex h-full flex-col p-5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <p.icon className="h-5 w-5 text-primary" />
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {p.note && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{p.note}</span>}
                            {p.plan && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                                <Crown className="h-2.5 w-2.5" /> {PLAN_LABEL[p.plan]}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 font-serif text-base font-semibold">{p.name}</div>
                        <p className="mt-1 flex-1 text-sm text-muted-foreground font-sans">{p.description}</p>
                        <span className="mt-4 inline-flex items-center text-sm font-medium text-primary font-sans">
                          Open <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ChildrenStudio;
