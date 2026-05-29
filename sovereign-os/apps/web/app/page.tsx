import { SiteHeader } from '../components/SiteHeader';
import { Hero } from '../components/Hero';
import { TrustBar } from '../components/TrustBar';
import { OperationalFootprint } from '../components/OperationalFootprint';
import { Outcomes } from '../components/Outcomes';
import { SectionSeparator } from '../components/SectionSeparator';
import { SovereignLayers } from '../components/SovereignLayers';
import { IntelligenceAgents } from '../components/IntelligenceAgents';
import { DistributionGrid } from '../components/DistributionGrid';
import { ProvenanceTrust } from '../components/ProvenanceTrust';
import { Testimonials } from '../components/Testimonials';
import { Faq } from '../components/Faq';
import { ClosingCta } from '../components/ClosingCta';
import { Footer } from '../components/Footer';

// Outcome-led marketing composition. Operational layers (Studio, Billing,
// Console, Subscriptions) remain untouched and accessible via header / footer.
//
// Chapter structure:
//   I.  Authority      Hero · TrustBar · Footprint · Outcomes
//   ── DOCTRINE ──
//   II. Operations     Capability · Intelligence · Distribution
//   ── POSTURE ──
//   III. Governance    Trust · Testimonials · FAQ · Closing
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <TrustBar />
      <OperationalFootprint />
      <Outcomes />
      <SectionSeparator label="Doctrine" />
      <SovereignLayers />
      <IntelligenceAgents />
      <DistributionGrid />
      <SectionSeparator label="Posture" />
      <ProvenanceTrust />
      <Testimonials />
      <Faq />
      <ClosingCta />
      <Footer />
    </>
  );
}
