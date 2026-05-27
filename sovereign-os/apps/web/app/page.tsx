import { SiteHeader } from '../components/SiteHeader';
import { Hero } from '../components/Hero';
import { Layers } from '../components/Layers';
import { Pricing } from '../components/Pricing';
import { Footer } from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <Layers />
      <Pricing />
      <Footer />
    </>
  );
}
