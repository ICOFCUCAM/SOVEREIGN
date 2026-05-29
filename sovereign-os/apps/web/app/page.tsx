import { SiteHeader } from '../components/SiteHeader';
import { Hero } from '../components/Hero';
import { TrustBar } from '../components/TrustBar';
import { WhyInfrastructure } from '../components/WhyInfrastructure';
import { OperationalFootprint } from '../components/OperationalFootprint';
import { Outcomes } from '../components/Outcomes';
import { SectionSeparator } from '../components/SectionSeparator';
import { SovereignLayers } from '../components/SovereignLayers';
import { IntelligenceAgents } from '../components/IntelligenceAgents';
import { DistributionGrid } from '../components/DistributionGrid';
import { InstitutionalDeployments } from '../components/InstitutionalDeployments';
import { InstitutionalApplications } from '../components/InstitutionalApplications';
import { ProvenanceTrust } from '../components/ProvenanceTrust';
import { Testimonials } from '../components/Testimonials';
import { Faq } from '../components/Faq';
import { SovereignNetwork } from '../components/SovereignNetwork';
import { ClosingCta } from '../components/ClosingCta';
import { Footer } from '../components/Footer';

// Three-act composition. Operational layers (Studio, Billing, Console,
// Subscriptions) remain untouched and accessible via header / footer.
//
//   I.   Authority      Hero · TrustBar · Why · Footprint · Outcomes
//   ── DOCTRINE ──
//   II.  Operations     Capability · Intelligence · Distribution
//                       Deployment Surfaces · Institutional Applications
//   ── POSTURE ──
//   III. Governance     Trust · Testimonials · FAQ · Sovereign Network · Closing
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <TrustBar />
      <WhyInfrastructure />
      <OperationalFootprint />
      <Outcomes />
      <SectionSeparator label="Doctrine" />
      <SovereignLayers />
      <IntelligenceAgents />
      <DistributionGrid />
      <InstitutionalDeployments />
      <InstitutionalApplications />
      <SectionSeparator label="Posture" />
      <ProvenanceTrust />
      <Testimonials />
      <Faq />
      <SovereignNetwork />
      <ClosingCta />
      <Footer />
    </>
  );
}
