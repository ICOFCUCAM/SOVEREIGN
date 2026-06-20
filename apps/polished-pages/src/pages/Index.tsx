import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PillarsSection from "@/components/PillarsSection";
import WorkflowSection from "@/components/WorkflowSection";
import PlatformStats from "@/components/PlatformStats";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <PillarsSection />
      <WorkflowSection />
      <PlatformStats />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
