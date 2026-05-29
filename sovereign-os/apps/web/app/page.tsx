import { SiteHeader } from '../components/SiteHeader';
import { Hero } from '../components/Hero';
import { TrustBar } from '../components/TrustBar';
import { Outcomes } from '../components/Outcomes';
import { SovereignLayers } from '../components/SovereignLayers';
import { IntelligenceAgents } from '../components/IntelligenceAgents';
import { DistributionGrid } from '../components/DistributionGrid';
import { ProvenanceTrust } from '../components/ProvenanceTrust';
import { Testimonials } from '../components/Testimonials';
import { Faq } from '../components/Faq';
import { ClosingCta } from '../components/ClosingCta';
import { Footer } from '../components/Footer';

// Outcome-led marketing composition. Architecture detail is moved deeper into
// the platform (docs, console). MediaClasses lives at /docs/video-formats.
// Operational layers (Studio, Billing, Console, Subscriptions) remain
// untouched and accessible via the header and footer.
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <TrustBar />
      <Outcomes />
      <SovereignLayers />
      <IntelligenceAgents />
      <DistributionGrid />
      <ProvenanceTrust />
      <Testimonials />
      <Faq />
      <ClosingCta />
      <Footer />
    </>
  );
}
