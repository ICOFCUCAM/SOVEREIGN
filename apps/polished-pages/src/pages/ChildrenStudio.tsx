import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookHeart, Sparkles, Palette, GraduationCap, PencilRuler, NotebookPen, School, BookOpenCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  name: string;
  description: string;
  icon: typeof BookHeart;
  status: "live" | "soon";
  path?: string;
  note?: string;
}

const PRODUCTS: Product[] = [
  { name: "Storybook Creator", description: "A complete illustrated picture book — story, illustrations, cover and printable PDF — tuned to a child’s age and reading level.", icon: BookHeart, status: "live", path: "/storybook" },
  { name: "Personalized Books", description: "Make the child the hero of their own adventure — “James and the Lost Forest.” Built into the Storybook Creator: just add the child’s name.", icon: Sparkles, status: "live", path: "/storybook", note: "In Storybook Creator" },
  { name: "Coloring Books", description: "Black-and-white line-art pages from any theme, ready to print and colour.", icon: Palette, status: "soon" },
  { name: "Educational Readers", description: "Alphabet, reading, vocabulary and first science / geography books by age band.", icon: BookOpenCheck, status: "soon" },
  { name: "Workbooks", description: "Exercises, worksheets and answer keys to accompany any reader.", icon: PencilRuler, status: "soon" },
  { name: "Classroom Packs", description: "Grade + subject + topic → student book, workbook, teacher guide, quiz and answer sheet.", icon: NotebookPen, status: "soon" },
  { name: "Primary School Textbooks", description: "Maths, English, French, Science, History and Geography with lessons, illustrations and exercises.", icon: School, status: "soon" },
  { name: "Curriculum Builder", description: "Country + grade + subject + term → scheme of work, lesson plans, student books and assessments.", icon: GraduationCap, status: "soon" },
];

const ChildrenStudio = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
          <BookHeart className="w-4 h-4 text-gold" />
          <span className="text-sm text-gold-light font-medium font-sans">Children’s Publishing Studio</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Publish for <span className="text-gradient-gold italic">young readers</span></h1>
        <p className="mt-2 max-w-2xl text-muted-foreground font-sans">
          A dedicated studio for children’s and educational publishing — illustrated storybooks today, with readers, workbooks, classroom packs and primary textbooks on the way.
        </p>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PRODUCTS.map((p, i) => {
          const live = p.status === "live";
          const card = (
            <Card className={`h-full border-border transition-all ${live ? "hover:border-primary/50 hover:shadow-premium" : "opacity-75"}`}>
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${live ? "bg-primary/10" : "bg-muted"}`}>
                    <p.icon className={`h-5 w-5 ${live ? "text-primary" : "text-muted-foreground"}`} />
                  </span>
                  <span className="font-serif text-lg font-semibold">{p.name}</span>
                  {live
                    ? p.note && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{p.note}</span>
                    : <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Coming soon</span>}
                </div>
                <p className="mt-3 flex-1 text-sm text-muted-foreground font-sans">{p.description}</p>
                {live && (
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-primary font-sans">
                    Open <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                )}
              </CardContent>
            </Card>
          );
          return live && p.path ? (
            <Link key={p.name} to={p.path} className="group block">{card}</Link>
          ) : (
            <div key={p.name}>{card}</div>
          );
        })}
      </div>
    </div>
  );
};

export default ChildrenStudio;
