import { SiteHeader } from '../components/SiteHeader';
import { Hero } from '../components/Hero';
import { TrustBar } from '../components/TrustBar';
import { Capabilities } from '../components/Capabilities';
import { Enterprise } from '../components/Enterprise';
import { ClosingCta } from '../components/ClosingCta';
import { Footer } from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <TrustBar />
      <Capabilities />
      <Enterprise />
      <ClosingCta />
      <Footer />
    </>
  );
}
