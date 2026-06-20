import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Users, FolderLock, Globe, BookOpen, ShieldCheck, ArrowRight, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BRAND } from "@/lib/tools";

const CAPABILITIES = [
  { icon: Users, title: "Teacher & student accounts", desc: "Roll out the studio across a department, a school or a district, with content that stays inside your organization." },
  { icon: BookOpen, title: "Curriculum at scale", desc: "Generate aligned textbooks, workbooks, exams and full curricula for any grade, subject and country." },
  { icon: FolderLock, title: "Shared repositories", desc: "A common library of approved resources every teacher can draw from and adapt." },
  { icon: Globe, title: "Any language & curriculum", desc: "Localize materials into dozens of languages and adapt them to your national curriculum." },
];

const GOVERNANCE = [
  { icon: ShieldCheck, title: "You own the content", desc: "Everything created under your organization belongs to your organization — with full rights to use and distribute it." },
  { icon: FolderLock, title: "Private by default", desc: "Nothing is public until someone in your organization chooses to publish or share it." },
  { icon: GraduationCap, title: "Built for classrooms", desc: "Age-appropriate educational tooling designed for teachers, students and structured learning outcomes." },
];

const ForSchools = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main id="main">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-hero-gradient pt-28 pb-20">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gold-gradient opacity-70" />
        <div className="container px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-educational/20 bg-educational/5 px-4 py-1.5">
              <Building2 className="h-4 w-4 text-educational" />
              <span className="text-sm font-medium text-educational font-sans">For schools, NGOs &amp; ministries</span>
            </div>
            <h1 className="text-display mt-5 text-4xl font-bold leading-[1.1] md:text-6xl">Equip every classroom with a <span className="text-gradient-gold italic">publishing studio</span></h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground font-sans text-pretty">
              {BRAND} gives schools, NGOs and education ministries the tools to create, localize and distribute curriculum-aligned materials at scale — in any language, for any grade.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg" className="px-8 py-6"><Link to="/pricing">See institutional plans <ArrowRight className="ml-1 h-5 w-5" /></Link></Button>
              <Button asChild variant="heroOutline" size="lg" className="px-8 py-6"><a href={`mailto:?subject=${encodeURIComponent(`${BRAND} — institutional enquiry`)}`}>Talk to our team</a></Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20">
        <div className="container px-6">
          <h2 className="text-center font-serif text-3xl font-bold md:text-4xl">Made for institutions</h2>
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((c, i) => (
              <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-5 shadow-e1">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-educational/10"><c.icon className="h-5 w-5 text-educational" /></span>
                <div>
                  <h3 className="font-sans text-base font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground font-sans text-pretty">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance */}
      <section className="border-t border-border/40 bg-card/30 py-20">
        <div className="container px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Governance &amp; ownership</h2>
            <p className="mt-3 text-muted-foreground font-sans text-pretty">The assurances institutions need before adopting any platform — stated plainly.</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
            {GOVERNANCE.map((g) => (
              <div key={g.title} className="rounded-xl border border-border bg-background p-5 shadow-e1">
                <g.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-sans text-base font-semibold">{g.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground font-sans text-pretty">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-gradient-to-br from-educational/[0.06] to-background p-10 text-center shadow-e2">
            <Sparkles className="mx-auto h-6 w-6 text-educational" />
            <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">Bring {BRAND} to your organization</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground font-sans text-pretty">Annual licensing, onboarding and curriculum support, priced to your programme. Tell us about your needs and we’ll design the right plan.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="hero"><a href={`mailto:?subject=${encodeURIComponent(`${BRAND} — institutional enquiry`)}`}>Contact our team <ArrowRight className="ml-1 h-4 w-4" /></a></Button>
              <Button asChild variant="heroOutline"><Link to="/pricing">Compare plans</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default ForSchools;
