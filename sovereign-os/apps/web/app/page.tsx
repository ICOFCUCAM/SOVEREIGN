import { SiteHeader } from '../components/SiteHeader';
import { Hero } from '../components/Hero';
import { Layers } from '../components/Layers';
import { MediaClasses } from '../components/MediaClasses';
import { Platforms } from '../components/Platforms';
import { Agents } from '../components/Agents';
import { Comparison } from '../components/Comparison';
import { Architecture } from '../components/Architecture';
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
      <Layers />
      <MediaClasses />
      <Platforms />
      <Agents />
      <Comparison />
      <Architecture />
      <Pricing />
      <Trust />
      <Faq />
      <ClosingCta />
      <Footer />
    </>
  );
}
