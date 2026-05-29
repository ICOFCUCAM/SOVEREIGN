import { SiteHeader } from '../components/SiteHeader';
import { Hero } from '../components/Hero';
import { TrustBar } from '../components/TrustBar';
import { SovereignLayers } from '../components/SovereignLayers';
import { MediaClasses } from '../components/MediaClasses';
import { DistributionGrid } from '../components/DistributionGrid';
import { IntelligenceAgents } from '../components/IntelligenceAgents';
import { ProvenanceTrust } from '../components/ProvenanceTrust';
import { Testimonials } from '../components/Testimonials';
import { Faq } from '../components/Faq';
import { ClosingCta } from '../components/ClosingCta';
import { Footer } from '../components/Footer';

// Marketing layer composition — outcomes-led hero, three architectural layers,
// then a progressive reveal of the four media classes, the eleven distribution
// surfaces, and the seven intelligence agents. Trust + FAQ ground the close.
// Operational surfaces (Studio, Billing, Console, Subscriptions) are
// untouched and accessible via the header / footer.
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <TrustBar />
      <SovereignLayers />
      <MediaClasses />
      <DistributionGrid />
      <IntelligenceAgents />
      <ProvenanceTrust />
      <Testimonials />
      <Faq />
      <ClosingCta />
      <Footer />
    </>
  );
}
