import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import GlobalKnowledgeNetwork from "@/components/home/GlobalKnowledgeNetwork";
import PlatformStats from "@/components/PlatformStats";
import FeatureStage from "@/components/home/FeatureStage";
import PublishingVisual from "@/components/home/PublishingVisual";
import LocalizationVisual from "@/components/home/LocalizationVisual";
import MarketplaceVisual from "@/components/home/MarketplaceVisual";
import CurriculumVisual from "@/components/home/CurriculumVisual";
import KnowledgeEcosystem from "@/components/home/KnowledgeEcosystem";
import TrustBand from "@/components/TrustBand";
import EnterpriseBand from "@/components/home/EnterpriseBand";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only z-[100] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-2">Skip to content</a>
      <Navbar />
      <main id="main">
        <HeroSection />
        <GlobalKnowledgeNetwork />
        <PlatformStats />

        <FeatureStage
          chapter="01" act="Create"
          eyebrow="Publishing Studio"
          eyebrowClass="text-publishing"
          title={<>From blank page to a book the <span className="italic text-publishing">world can buy</span>.</>}
          body="Draft, illustrate and produce a complete book, then export print-ready files for KDP, IngramSpark and every major store."
          ctaLabel="Start a book"
          ctaTo="/book"
          glow="hsl(262 83% 58% / 0.20)"
          visual={<PublishingVisual />}
        />

        <FeatureStage
          chapter="02" act="Localize" alt
          eyebrow="Localization"
          eyebrowClass="text-primary"
          title={<>Write once. Sell in <span className="italic text-primary">forty languages</span>.</>}
          body="Translate or culturally adapt any title for new markets — the same story, ready for readers on every continent."
          ctaLabel="See localization"
          ctaTo="/translate"
          glow="hsl(221 83% 53% / 0.20)"
          reversed
          visual={<LocalizationVisual />}
        />

        <FeatureStage
          chapter="03" act="Distribute"
          eyebrow="Marketplace"
          eyebrowClass="text-marketplace"
          title={<>A global storefront the day you <span className="italic text-marketplace">finish</span>.</>}
          body="List to a discovery-driven marketplace with author pages, ratings and pricing — reaching readers, parents and schools."
          ctaLabel="Explore the marketplace"
          ctaTo="/catalog"
          glow="hsl(38 92% 50% / 0.20)"
          visual={<MarketplaceVisual />}
        />

        <FeatureStage
          chapter="04" act="Teach" alt
          eyebrow="Educational Studio"
          eyebrowClass="text-educational"
          title={<>Whole curricula, <span className="italic text-educational">classroom-ready</span>.</>}
          body="Generate standards-aligned schemes of work, lessons, workbooks and exams — for any grade, subject and language."
          ctaLabel="Open the studio"
          ctaTo="/curriculum"
          glow="hsl(160 84% 40% / 0.20)"
          reversed
          visual={<CurriculumVisual />}
        />

        <KnowledgeEcosystem />
        <TrustBand />
        <EnterpriseBand />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
