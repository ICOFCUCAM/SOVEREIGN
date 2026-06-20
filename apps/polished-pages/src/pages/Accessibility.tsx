import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check } from "lucide-react";
import { BRAND } from "@/lib/tools";

// Honest accessibility statement — every measure listed is actually implemented
// in the product (focus indicators, AA contrast, skip links, reduced-motion,
// semantic landmarks). A real procurement artifact for institutional buyers.
const MEASURES = [
  "Visible keyboard focus indicators on links, buttons and interactive elements",
  "Skip-to-content links and semantic <main> landmarks on every page",
  "Body and secondary text tuned to meet WCAG AA contrast on light surfaces",
  "Motion respects the prefers-reduced-motion setting — animations are disabled when requested",
  "Form controls use real labels; icon-only controls carry accessible names",
  "Responsive layouts that reflow cleanly from mobile to desktop without loss of content",
];

const Accessibility = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main id="main" className="container max-w-2xl px-6 pb-20 pt-28">
      <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Accessibility at {BRAND}</h1>
      <p className="mt-3 text-muted-foreground font-sans text-pretty">
        We want every creator, teacher and student to be able to use {BRAND}. We build toward the WCAG 2.1 AA guidelines and treat accessibility as an ongoing commitment, not a one-time checkbox.
      </p>

      <h2 className="mt-10 font-serif text-xl font-bold">What we’ve implemented</h2>
      <ul className="mt-4 space-y-2.5">
        {MEASURES.map((m) => (
          <li key={m} className="flex items-start gap-2.5 text-sm font-sans">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span className="text-foreground/90">{m}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-serif text-xl font-bold">Ongoing work</h2>
      <p className="mt-3 text-muted-foreground font-sans text-pretty">
        Accessibility is never finished. We continue to audit new features against AA criteria and welcome reports of barriers so we can fix them. If you encounter an accessibility issue, contact our team and we’ll prioritize it.
      </p>
    </main>
    <Footer />
  </div>
);

export default Accessibility;
