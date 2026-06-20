import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PillarsSection from "@/components/PillarsSection";
import WorkflowSection from "@/components/WorkflowSection";
import PlatformStats from "@/components/PlatformStats";
import FeaturesSection from "@/components/FeaturesSection";
import TrustBand from "@/components/TrustBand";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only z-[100] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-2">Skip to content</a>
      <Navbar />
      <main id="main">
        <HeroSection />
        <PillarsSection />
        <WorkflowSection />
        <PlatformStats />
        <FeaturesSection />
        <TrustBand />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
