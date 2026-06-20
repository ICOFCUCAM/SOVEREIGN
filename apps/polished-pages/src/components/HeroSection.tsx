import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, PenTool, BookOpen, BookHeart, GraduationCap, Store } from "lucide-react";
import { Link } from "react-router-dom";

import heroCv from "@/assets/hero-cv-light.jpg";
import heroCoverLetter from "@/assets/hero-letter-light.jpg";
import heroBook from "@/assets/hero-book-light.jpg";

// Rotating visual showcase behind a fixed, platform-level message.
const slides = [
  { image: heroCv, icon: FileText, badge: "Career" },
  { image: heroCoverLetter, icon: PenTool, badge: "Cover letters" },
  { image: heroBook, icon: BookOpen, badge: "Books & publishing" },
];

const CAPABILITIES = [
  { icon: FileText, label: "Professional CVs" },
  { icon: BookOpen, label: "Books & publishing" },
  { icon: BookHeart, label: "Children’s books" },
  { icon: GraduationCap, label: "Educational content" },
  { icon: Store, label: "Marketplace distribution" },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];
  const Icon = slide.icon;

  const imageVariants = {
    enter: { opacity: 0, scale: 1.05 },
    center: { opacity: 1, scale: 1, transition: { duration: 1, ease: "easeOut" as const } },
    exit: { opacity: 0, scale: 1.02, transition: { duration: 0.6 } },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background images */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${current}`}
          variants={imageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.badge}
            className="w-full h-full object-cover opacity-70"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
        </motion.div>
      </AnimatePresence>

      {/* Gold accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient opacity-60" />

      <div className="container relative z-10 px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium font-sans">The creation &amp; publishing platform · {slide.badge}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-foreground">
            Create, publish and distribute <span className="text-gradient-gold italic">documents, books and educational content</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            Build CVs, cover letters, books, children’s storybooks, workbooks and curricula with AI — then publish to KDP and IngramSpark, translate into any language, and sell in the marketplace. All from one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="text-base px-8 py-6" asChild>
              <Link to="/dashboard">Start creating <ArrowRight className="w-5 h-5 ml-1" /></Link>
            </Button>
            <Button variant="heroOutline" size="lg" className="text-base px-8 py-6" asChild>
              <Link to="/catalog">Explore the marketplace</Link>
            </Button>
          </div>
        </motion.div>

        {/* Capability strip (real capabilities, not vanity metrics) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-14 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-border pt-8"
        >
          {CAPABILITIES.map((c) => (
            <div key={c.label} className="inline-flex items-center gap-2 text-sm text-muted-foreground font-sans">
              <c.icon className="h-4 w-4 text-gold" /> {c.label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
