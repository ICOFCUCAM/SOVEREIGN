import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Users, FolderLock, Globe, BookOpen, ShieldCheck, ArrowRight, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BRAND } from "@/lib/tools";

// A structured enquiry template so the sales-led contact arrives with the
// context needed to scope a plan — far better than an empty mailto.
const ENQUIRY = `mailto:?subject=${encodeURIComponent(`${BRAND} — institutional enquiry`)}&body=${encodeURIComponent(
  [
    "Organization name:",
    "Type (school / district / NGO / ministry / business):",
    "Approximate number of teachers or seats:",
    "What you'd like to create (curriculum, textbooks, assessments, storybooks…):",
    "Languages / country / curriculum:",
    "",
    "Anything else we should know:",
  ].join("\n"),
)}`;

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
      {/* Hero — institutional dark stage */}
      <section className="relative overflow-hidden text-white" style={{ background: "radial-gradient(120% 90% at 50% -10%, hsl(222 47% 12%) 0%, hsl(222 47% 7%) 45%, hsl(224 60% 4%) 100%)" }}>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 left-1/4 h-[26rem] w-[26rem] animate-glow-pulse rounded-full bg-[hsl(160_84%_40%)]/20 blur-[120px]" />
          <div className="absolute -top-16 right-1/4 h-[22rem] w-[22rem] animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/22 blur-[120px]" style={{ animationDelay: "2s" }} />
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(160_84%_50%)]/60 to-transparent" />
        <div className="container relative px-6 pb-20 pt-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
              <Building2 className="h-4 w-4 text-[hsl(160_84%_55%)]" />
              <span className="eyebrow text-white/70">Schools · NGOs · Ministries</span>
            </div>
            <h1 className="text-display mt-5 text-4xl font-bold md:text-6xl">
              Equip every classroom with a{" "}
              <span className="bg-gradient-to-r from-[hsl(160_84%_60%)] via-[hsl(190_84%_64%)] to-[hsl(217_91%_72%)] bg-clip-text italic text-transparent">publishing studio</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/55 font-sans text-pretty">
              {BRAND} gives schools, NGOs and education ministries the operating system to create, localize and distribute curriculum-aligned materials at scale — in any language, for any grade.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[hsl(160_84%_40%)] to-[hsl(190_84%_38%)] px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]">See institutional plans <ArrowRight className="h-5 w-5" /></Link>
              <a href={ENQUIRY} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10">Talk to our team</a>
            </div>
            <Link to="/security" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white/55 hover:text-white">
              <ShieldCheck className="h-4 w-4 text-[hsl(217_91%_72%)]" /> Read the Security &amp; Governance overview
            </Link>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* Capabilities */}
      <section className="py-20">
        <div className="container px-6">
          <div className="text-center">
            <p className="eyebrow text-educational">Built for scale</p>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Made for institutions</h2>
          </div>
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
            <p className="eyebrow text-primary">Trust</p>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Governance &amp; ownership</h2>
            <p className="mt-3 text-muted-foreground font-sans text-pretty">The assurances institutions need before adopting any platform — stated plainly. <Link to="/security" className="text-primary hover:underline">See the full Security &amp; Governance overview →</Link></p>
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
              <Button asChild variant="hero"><a href={ENQUIRY}>Contact our team <ArrowRight className="ml-1 h-4 w-4" /></a></Button>
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
