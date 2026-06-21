import { motion } from "framer-motion";
import { Copyright, ShieldCheck, Globe, Download, BookMarked, Lock } from "lucide-react";

// Capability-based trust — every claim is a real, verifiable platform guarantee
// (no fabricated testimonials or invented metrics). Presented as an airy,
// borderless editorial grid rather than a wall of boxed cards.
const TRUST = [
  { icon: Copyright, title: "You own everything", desc: "Full ownership of every document, book and illustration you create." },
  { icon: ShieldCheck, title: "Full commercial rights", desc: "Sell what you make, with no royalties owed back to the platform." },
  { icon: BookMarked, title: "Store-ready exports", desc: "Print-ready PDF and EPUB for KDP, IngramSpark and every major store." },
  { icon: Globe, title: "Any language", desc: "Translate or culturally localize your work into dozens of languages." },
  { icon: Download, title: "No lock-in", desc: "Export your files at any time — your work is never trapped here." },
  { icon: Lock, title: "Private by default", desc: "Nothing you create is public until you choose to publish or share it." },
];

const TrustBand = () => (
  <section className="border-t border-border/40 bg-background py-24 md:py-32">
    <div className="container px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-primary">Yours to keep</p>
        <h2 className="text-display mt-3 text-3xl font-bold text-foreground md:text-[2.6rem]">Built for real, ownable work</h2>
        <p className="mt-4 text-lg text-muted-foreground font-sans text-pretty">Everything you make is yours to keep, sell and take with you — the guarantees that matter when you're building a body of work.</p>
      </motion.div>

      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <t.icon className="h-5 w-5 text-primary" />
            </span>
            <h3 className="mt-4 font-serif text-lg font-bold text-foreground">{t.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground font-sans text-pretty">{t.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBand;
