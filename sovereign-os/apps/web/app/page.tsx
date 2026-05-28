import { SiteHeader } from '../components/SiteHeader';
import { Hero } from '../components/Hero';
import { Capabilities } from '../components/Capabilities';
import { OperatingLayer } from '../components/OperatingLayer';
import { Pricing } from '../components/Pricing';
import { Trust } from '../components/Trust';
import { Faq } from '../components/Faq';
import { ClosingCta } from '../components/ClosingCta';
import { Footer } from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <Capabilities />
      <OperatingLayer />
      <Pricing />
      <Trust />
      <Faq />
      <ClosingCta />
      <Footer />
    </>
  );
}
