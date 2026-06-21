import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Database, Accessibility as A11y, Building2, FileCheck, Check, ArrowRight, KeyRound, Download, Globe } from "lucide-react";
import { BRAND } from "@/lib/tools";

// Security & Governance — a real procurement artifact for ministries, districts,
// universities and publishers. Every statement describes how the platform is
// actually built or what is offered under an institutional agreement. No
// fabricated certifications or badges: posture is described honestly, and
// formal attestations are framed as available on request / on the roadmap.

interface Section {
  icon: typeof ShieldCheck;
  title: string;
  lead: string;
  points: string[];
}

const SECTIONS: Section[] = [
  {
    icon: KeyRound,
    title: "Data ownership",
    lead: "What you create is yours — fully, commercially, and permanently.",
    points: [
      "You hold full ownership and commercial rights to every document, book, illustration and assessment you create.",
      "Export your work at any time as EPUB, print-ready PDF or DOCX — there is no lock-in and no proprietary trap.",
      "We do not sell your content, and we do not use your private work to train models.",
      "Delete your account and content on request; deletion removes your private material from active systems.",
    ],
  },
  {
    icon: Lock,
    title: "Privacy by default",
    lead: "Nothing is public until you decide it is.",
    points: [
      "Every document is private to your account by default — publishing or sharing is always an explicit choice.",
      "Per-user data isolation is enforced at the database layer with row-level security, not just in the application.",
      "Public links and marketplace listings are opt-in and revocable.",
      "Generation is metered and authenticated per user, so quotas and access can never be bypassed from the client.",
    ],
  },
  {
    icon: Database,
    title: "Security architecture",
    lead: "Built on managed, industry-standard infrastructure.",
    points: [
      "Hosted on managed PostgreSQL with encryption in transit (TLS) and encryption at rest.",
      "Server-side authorization on every privileged operation; least-privilege service roles for backend functions.",
      "Secrets are held server-side and never exposed to the browser; cross-service calls are authenticated.",
      "Formal attestations (e.g. SOC 2) are on our roadmap — we’re glad to share our current security posture and answer a questionnaire under NDA.",
    ],
  },
  {
    icon: A11y,
    title: "Accessibility",
    lead: "Built toward WCAG 2.1 AA, because institutions are accountable for it.",
    points: [
      "Visible keyboard focus, semantic landmarks, skip-to-content links and reduced-motion support across the product.",
      "Text contrast tuned to meet AA on primary surfaces; labelled controls and accessible names on icon actions.",
      "Accessibility is treated as an ongoing commitment with a published statement, not a one-time checkbox.",
    ],
  },
  {
    icon: Building2,
    title: "Deployment for institutions",
    lead: "Models that fit how ministries, districts and publishers actually buy.",
    points: [
      "Annual licensing with teacher and student accounts, invoiced billing and a named point of contact.",
      "Single sign-on (SSO/SAML), custom data-handling and data-residency options are available under institutional agreements.",
      "Dedicated onboarding and curriculum-alignment support for programmes rolling out at scale.",
      "A Data Processing Agreement (DPA) is available for organizations that require one.",
    ],
  },
];

const PROCUREMENT = [
  "Clear, written data-ownership and licensing terms",
  "Published accessibility statement (WCAG 2.1 AA)",
  "Security posture overview and questionnaire support",
  "Annual, invoiced licensing with a named contact",
  "Data Processing Agreement on request",
];

const Security = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Authority hero */}
    <section className="relative overflow-hidden text-white" style={{ background: "radial-gradient(120% 90% at 50% -10%, hsl(222 47% 12%) 0%, hsl(222 47% 7%) 45%, hsl(224 60% 4%) 100%)" }}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/4 h-[26rem] w-[26rem] animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/22 blur-[120px]" />
        <div className="absolute -top-16 right-1/4 h-[22rem] w-[22rem] animate-glow-pulse rounded-full bg-[hsl(160_84%_40%)]/18 blur-[120px]" style={{ animationDelay: "2s" }} />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(217_91%_64%)]/60 to-transparent" />
      <div className="container relative max-w-4xl px-6 pb-16 pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
          <ShieldCheck className="h-4 w-4 text-[hsl(217_91%_70%)]" />
          <span className="eyebrow text-white/70">Security &amp; Governance</span>
        </div>
        <h1 className="text-display mt-5 text-4xl font-bold md:text-6xl">
          Built for <span className="bg-gradient-to-r from-[hsl(217_91%_72%)] via-[hsl(190_84%_70%)] to-[hsl(160_84%_62%)] bg-clip-text italic text-transparent">institutions</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/55 font-sans">
          How {BRAND} handles ownership, privacy, security and accessibility — written plainly, for the people who have to sign off on it.
        </p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background" />
    </section>

    <main id="main" className="container max-w-4xl px-6 py-16 sm:py-20">
      <div className="space-y-16">
        {SECTIONS.map((s) => (
          <section key={s.title} className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </span>
              <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight">{s.title}</h2>
            </div>
            <div>
              <p className="text-lg font-medium text-foreground font-sans text-pretty">{s.lead}</p>
              <ul className="mt-5 space-y-3">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground font-sans">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-primary" /> <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      {/* Procurement summary */}
      <section className="mt-20 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/50 to-card p-8 sm:p-12">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-2xl font-bold tracking-tight">What procurement receives</h2>
        </div>
        <p className="mt-2 max-w-xl text-muted-foreground font-sans">Everything a review board needs to evaluate {BRAND} for institutional use.</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {PROCUREMENT.map((p) => (
            <li key={p} className="flex items-start gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm font-sans">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span className="text-foreground/90">{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/for-schools" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.03]">
            <Building2 className="h-4 w-4" /> Institutional plans <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/accessibility" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
            <A11y className="h-4 w-4" /> Accessibility statement
          </Link>
        </div>
      </section>

      {/* Quick assurances strip */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground font-sans">
        <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4 text-primary" /> No lock-in</span>
        <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" /> Private by default</span>
        <span className="inline-flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-primary" /> You own your data</span>
        <span className="inline-flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> Hosted on managed Postgres</span>
      </div>
    </main>

    <Footer />
  </div>
);

export default Security;
