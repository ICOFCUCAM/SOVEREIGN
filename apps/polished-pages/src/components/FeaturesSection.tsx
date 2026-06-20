import { motion } from "framer-motion";
import { FileText, BookOpen, PenTool, Target, GraduationCap, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import featureCv from "@/assets/feature-cv.jpg";
import featureLetter from "@/assets/feature-letter.jpg";
import featureBook from "@/assets/feature-book.jpg";

const features = [
  {
    icon: FileText,
    title: "CV Builder",
    description: "ATS-optimized CVs with achievement-focused bullet points, tailored to any role.",
    image: featureCv,
    link: "/cv",
    cta: "Build CV",
  },
  {
    icon: Target,
    title: "Tailor to a Job",
    description: "Upload your CV and a job posting — get a re-focused CV, a matching cover letter, and an honest fit score in one step.",
    image: featureLetter,
    link: "/tailor",
    cta: "Tailor My CV",
  },
  {
    icon: BookOpen,
    title: "Book Creator & Publishing",
    description: "Full-length books with structured chapters, illustrated covers, and store-ready EPUB, KDP and IngramSpark exports.",
    image: featureBook,
    link: "/book",
    cta: "Create a Book",
  },
  {
    icon: GraduationCap,
    title: "Children’s & Educational Studio",
    description: "Illustrated storybooks and series, coloring books, leveled readers, workbooks, exams and full curricula — in any language.",
    image: featureLetter,
    link: "/children",
    cta: "Open the Studio",
  },
  {
    icon: PenTool,
    title: "Cover Letters",
    description: "Personalized, human-sounding cover letters aligned to specific job descriptions.",
    image: featureCv,
    link: "/cover-letter",
    cta: "Write a Letter",
  },
  {
    icon: Store,
    title: "Marketplace & Distribution",
    description: "Publish your work to a public marketplace with author pages, trending and discovery — and distribute to every major store.",
    image: featureBook,
    link: "/catalog",
    cta: "Explore the Marketplace",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            One platform for <span className="text-gradient-gold italic">career, publishing &amp; education</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-sans">
            Create professional documents, full books and educational content — then publish and sell them anywhere.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto space-y-20">
          {features.map((feature, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`flex flex-col ${isReversed ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`}
              >
                {/* Image */}
                <div className="flex-1 w-full">
                  <div className="relative rounded-2xl overflow-hidden shadow-premium border border-border">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-64 lg:h-80 object-cover"
                      loading="lazy"
                      width={800}
                      height={800}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/5 to-transparent" />
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 w-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3 font-serif text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground font-sans leading-relaxed text-lg mb-6">{feature.description}</p>
                  <Button variant="hero" size="default" asChild>
                    <Link to={feature.link}>
                      {feature.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
