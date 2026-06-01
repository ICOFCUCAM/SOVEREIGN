import React, { useState } from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import ContactModal from '@/components/ContactModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const TermsPage: React.FC = () => {
  useDocumentTitle('Terms of Service', 'Terms of Service for the SOVEREIGN platform.');
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Legal</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic leading-[0.96] mb-4">
            Terms of Service
          </h1>
          <p className="text-white/40 text-sm mb-10">Effective 1 January 2026</p>

          <div className="space-y-8 text-white/75 text-[15px] leading-relaxed">
            <section>
              <h2 className="font-display text-2xl font-bold text-white">1. Acceptance</h2>
              <p className="mt-3">By accessing or using the SOVEREIGN platform ("the Platform"), you agree to these Terms. If you do not agree, do not use the Platform.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">2. Accounts</h2>
              <p className="mt-3">You are responsible for safeguarding your credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">3. Subscriptions and payment</h2>
              <p className="mt-3">Paid plans are billed monthly through Stripe. Subscriptions renew automatically until canceled. Cancellation takes effect at the end of the current billing period; no pro-rata refunds are offered for partial periods unless required by law.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">4. Domain registrations</h2>
              <p className="mt-3">Domain registrations are subject to the policies of the relevant registry and the registrar. Registrant data is held under the privacy policy and may be transmitted to registries as required for registration to complete.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">5. Acceptable use</h2>
              <p className="mt-3">You may not use the Platform to engage in unlawful activity, infringe third-party rights, transmit malware, or operate phishing or fraud infrastructure. We may suspend accounts that violate these limits.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">6. Service availability</h2>
              <p className="mt-3">The Platform is provided on an as-is basis without warranty of uninterrupted service. Scheduled maintenance windows are announced in advance where reasonably possible.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">7. Limitation of liability</h2>
              <p className="mt-3">To the maximum extent permitted by law, the Platform's aggregate liability shall not exceed the amount paid by you in the twelve months preceding the claim. We are not liable for indirect or consequential damages.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">8. Changes</h2>
              <p className="mt-3">We may update these Terms from time to time. Material changes will be notified to active accounts before they take effect.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">9. Contact</h2>
              <p className="mt-3">Questions about these Terms: <button onClick={() => setOpen(true)} className="text-cyan-300 hover:text-white underline-offset-2 hover:underline">Open legal desk</button></p>
            </section>
          </div>
        </div>
      </main>
      <PlatformFooter />
      {open && <ContactModal purpose="legal" onClose={() => setOpen(false)} />}
    </div>
  );
};

export default TermsPage;
