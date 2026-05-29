import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const PrivacyPage: React.FC = () => {
  useDocumentTitle('Privacy Policy', 'Privacy Policy for the SOVEREIGN platform.');
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Legal</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic leading-[0.96] mb-4">
            Privacy Policy
          </h1>
          <p className="text-white/40 text-sm mb-10">Effective 1 January 2026</p>

          <div className="space-y-8 text-white/75 text-[15px] leading-relaxed">
            <section>
              <h2 className="font-display text-2xl font-bold text-white">1. What we collect</h2>
              <p className="mt-3">Account email, authentication state, registrant profile fields you provide for domain registrations, billing metadata supplied by Stripe, and standard request logs. We do not require any other personal information to use the Platform.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">2. How we use it</h2>
              <p className="mt-3">To operate the Platform, process payments, complete domain registrations, provide support, prevent abuse, and improve the service.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">3. Subprocessors</h2>
              <p className="mt-3">Supabase for hosting and storage, Stripe for payments, Openprovider as a registrar partner, OpenAI and Anthropic for language models, Runway for video synthesis. Each subprocessor is bound by their own terms.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">4. Retention</h2>
              <p className="mt-3">Account data is retained while your account is active. On deletion, account records are removed within thirty days, except where retention is required for legal, accounting, or registrar-policy purposes.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">5. Your rights</h2>
              <p className="mt-3">You may request access, correction, deletion, or export of your data. Email <a className="text-cyan-300 hover:text-white" href="mailto:privacy@sovereign.so">privacy@sovereign.so</a> with the request and the account email on file.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">6. Security</h2>
              <p className="mt-3">Encryption in transit and at rest; row-level security on all tenant tables; constant-time signature verification on webhooks; secrets are kept out of the client bundle.</p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold text-white">7. Contact</h2>
              <p className="mt-3"><a className="text-cyan-300 hover:text-white" href="mailto:privacy@sovereign.so">privacy@sovereign.so</a></p>
            </section>
          </div>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default PrivacyPage;
