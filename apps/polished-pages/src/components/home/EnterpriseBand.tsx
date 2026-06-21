import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, KeyRound, Accessibility as A11y, Building2, FileCheck, ArrowRight } from "lucide-react";

// Institutional credibility, stated as capability — what makes the platform
// safe to adopt for ministries, districts, universities and publishers. Every
// point is a real commitment (linked to the Security & Governance page), not a
// fabricated badge or customer claim.
const POINTS = [
  { icon: KeyRound, label: "You own your data", sub: "Full rights, export anytime" },
  { icon: A11y, label: "WCAG 2.1 AA", sub: "Accessibility as a commitment" },
  { icon: Building2, label: "Annual licensing & SSO", sub: "Under institutional agreement" },
  { icon: FileCheck, label: "DPA on request", sub: "Procurement-ready" },
];

const EnterpriseBand = () => (
  <section className="border-t border-border/40 bg-secondary/30 py-20 md:py-28">
    <div className="container px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-primary">For institutions</p>
        <h2 className="text-display mt-3 text-3xl font-bold text-foreground md:text-[2.6rem]">Ready for the people who answer to a board</h2>
        <p className="mt-4 text-lg text-muted-foreground font-sans text-pretty">Built for ministries, school districts, universities and publishing houses — with the ownership, privacy and governance their procurement teams require.</p>
      </motion.div>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map((p, i) => (
          <motion.div key={p.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-border bg-card p-5 text-center shadow-e1">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <p.icon className="h-5 w-5 text-primary" />
            </span>
            <div className="mt-3 font-sans text-sm font-semibold text-foreground">{p.label}</div>
            <div className="mt-0.5 font-sans text-xs text-muted-foreground">{p.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link to="/security" className="group inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
          <ShieldCheck className="h-4 w-4 text-primary" /> Read the Security &amp; Governance overview
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  </section>
);

export default EnterpriseBand;
