import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Briefcase, BookOpen, GraduationCap, Store, Rocket, CreditCard, Wand2, PenTool, Globe, Package, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND } from "@/lib/tools";

// A real hub of everything on the platform — studios, publishing/distribution,
// the marketplace and pricing — plus a plain "how it works". No placeholder
// content: every link goes somewhere real.
const STUDIOS = [
  { icon: Briefcase, name: "Career Studio", desc: "CV builder, job tailoring and cover letters.", to: "/cv" },
  { icon: BookOpen, name: "Publishing Studio", desc: "Book creator, transform, illustration and covers.", to: "/book" },
  { icon: GraduationCap, name: "Educational Studio", desc: "Children's books, classrooms and curricula.", to: "/children" },
  { icon: Store, name: "Marketplace", desc: "Discover, author pages, trending and categories.", to: "/catalog" },
  { icon: Rocket, name: "Publish & Distribute", desc: "EPUB, KDP and IngramSpark export center.", to: "/publishing" },
  { icon: CreditCard, name: "Plans & Pricing", desc: "Free, Creator, Professional, Publisher Pro and Business.", to: "/pricing" },
];

const STEPS = [
  { icon: Wand2, title: "Create", text: "Generate CVs, books, storybooks, workbooks or curricula with AI." },
  { icon: PenTool, title: "Refine", text: "Edit, restyle, illustrate and save to your library with version history." },
  { icon: Globe, title: "Localize", text: "Translate or culturally localize into any language, per edition." },
  { icon: Package, title: "Publish & distribute", text: "Export to EPUB, KDP and IngramSpark, and sell in the marketplace." },
];

const Resources = () => (
  <div className="min-h-screen bg-background">
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-lg">
      <div className="container flex items-center justify-between h-14 px-6">
        <Link to="/" className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /><span className="font-serif text-base font-bold">{BRAND}</span></Link>
        <Link to="/dashboard" className="text-sm text-primary hover:underline font-sans">Open the studio</Link>
      </div>
    </nav>

    <div className="container max-w-5xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-5xl">Resources</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground font-sans">Everything {BRAND} can do, in one place — the studios, publishing and distribution, the marketplace and pricing.</p>
      </motion.div>

      <h2 className="mt-12 font-serif text-xl font-bold">Explore the platform</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STUDIOS.map((s) => (
          <Link key={s.name} to={s.to}>
            <Card className="h-full border-border transition-all hover:border-primary/50 hover:shadow-premium">
              <CardContent className="flex h-full flex-col p-5">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></span>
                <h3 className="font-serif text-base font-semibold">{s.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground font-sans">{s.desc}</p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-primary font-sans">Open <ArrowRight className="ml-1 h-4 w-4" /></span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mt-14 font-serif text-xl font-bold">How it works</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((st, i) => (
          <Card key={st.title} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground"><span className="text-xs font-semibold font-sans">Step {i + 1}</span><st.icon className="h-4 w-4 text-gold" /></div>
              <h3 className="mt-2 font-serif text-base font-semibold">{st.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground font-sans">{st.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground font-sans">
        Ready to begin? <Link to="/dashboard" className="text-primary hover:underline">Start creating free</Link> or <Link to="/pricing" className="text-primary hover:underline">see pricing</Link>.
      </p>
    </div>
  </div>
);

export default Resources;
