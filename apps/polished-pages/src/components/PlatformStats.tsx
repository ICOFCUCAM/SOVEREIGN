import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { platformStats, type PlatformStats as Stats } from "@/lib/platform";

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`);

// Real marketplace scale, shown only once there's something worth showing.
// No fabricated numbers — if the marketplace is empty, this renders nothing.
const PlatformStats = () => {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { platformStats().then(setS).catch(() => {}); }, []);

  if (!s || s.resources < 1) return null;

  const items = [
    { v: s.resources, l: s.resources === 1 ? "published resource" : "published resources" },
    s.creators > 0 ? { v: s.creators, l: s.creators === 1 ? "creator" : "creators" } : null,
    s.categories > 0 ? { v: s.categories, l: "categories" } : null,
    s.downloads > 0 ? { v: s.downloads, l: "downloads" } : null,
    s.languages > 0 ? { v: s.languages, l: s.languages === 1 ? "language" : "languages" } : null,
  ].filter(Boolean) as { v: number; l: string }[];

  return (
    <section className="border-y border-border/60 bg-card/40">
      <motion.div
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-8"
      >
        {items.map((it) => (
          <div key={it.l} className="text-center">
            <div className="font-serif text-2xl font-bold text-foreground md:text-3xl">{fmt(it.v)}</div>
            <div className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground font-sans">{it.l}</div>
          </div>
        ))}
      </motion.div>
    </section>
  );
};

export default PlatformStats;
