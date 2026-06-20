import { motion } from "framer-motion";
import { Copyright, ShieldCheck, Globe, Download, BookMarked, Lock } from "lucide-react";

// Capability-based trust — every claim is a real, verifiable platform
// guarantee (no fabricated testimonials or invented metrics). Answers the
// "can I rely on this for real work?" question for authors and institutions.
const TRUST = [
  { icon: Copyright, title: "You own everything", desc: "Full ownership of every document, book and illustration you create." },
  { icon: ShieldCheck, title: "Full commercial rights", desc: "Sell what you make, with no royalties owed back to the platform." },
  { icon: BookMarked, title: "Store-ready exports", desc: "Print-ready PDF and EPUB for KDP, IngramSpark and every major store." },
  { icon: Globe, title: "Any language", desc: "Translate or culturally localize your work into dozens of languages." },
  { icon: Download, title: "No lock-in", desc: "Export your files at any time — your work is never trapped here." },
  { icon: Lock, title: "Private by default", desc: "Nothing you create is public until you choose to publish or share it." },
];

const TrustBand = () => (
  <section className="border-t border-border/40 bg-card/30 py-14 md:py-20">
    <div className="container px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">Built for <span className="text-gradient-gold italic">real, ownable work</span></h2>
        <p className="mt-3 text-muted-foreground font-sans text-pretty">Everything you make is yours to keep, sell and take with you. The guarantees that matter when you're building a body of work.</p>
      </motion.div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 shadow-e1"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <t.icon className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h3 className="font-sans text-sm font-semibold text-foreground">{t.title}</h3>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground font-sans text-pretty">{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBand;
