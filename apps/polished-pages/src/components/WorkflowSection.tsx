import { motion } from "framer-motion";
import { PenTool, Rocket, Globe, Send, Store } from "lucide-react";

// The ecosystem story: one platform that runs the whole publishing lifecycle.
// Reinforces the "operating system" positioning by making the end-to-end flow
// explicit, rather than presenting tools as a disconnected list.
const STEPS = [
  { icon: PenTool, label: "Create", color: "text-career", ring: "ring-career/20 bg-career/10", desc: "Write CVs, books, storybooks, workbooks and full curricula with AI." },
  { icon: Rocket, label: "Publish", color: "text-publishing", ring: "ring-publishing/20 bg-publishing/10", desc: "Organize titles into series and linked, versioned editions." },
  { icon: Globe, label: "Localize", color: "text-educational", ring: "ring-educational/20 bg-educational/10", desc: "Translate or culturally adapt into any language and market." },
  { icon: Send, label: "Distribute", color: "text-primary", ring: "ring-primary/20 bg-primary/10", desc: "Export to KDP, IngramSpark and every major store, print-ready." },
  { icon: Store, label: "Sell", color: "text-marketplace", ring: "ring-marketplace/20 bg-marketplace/10", desc: "List on the marketplace and reach readers, parents and schools." },
];

const WorkflowSection = () => (
  <section className="border-t border-border/40 bg-background py-16 md:py-24">
    <div className="container px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-14 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">One platform, the whole journey</p>
        <h2 className="mt-2 text-3xl font-bold text-foreground md:text-5xl">From idea to <span className="text-gradient-gold italic">income</span></h2>
        <p className="mt-3 text-lg text-muted-foreground font-sans text-pretty">Every stage of publishing and educational creation lives in one connected system — no exporting between disconnected tools.</p>
      </motion.div>

      <div className="relative mx-auto max-w-6xl">
        {/* Connecting rail behind the steps on desktop */}
        <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative text-center"
            >
              <div className={`relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${s.ring} shadow-e1`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold text-muted-foreground shadow-e1 ring-1 ring-border">{i + 1}</span>
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold">{s.label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground font-sans text-pretty">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default WorkflowSection;
