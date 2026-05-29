import { SiteHeader } from '../../../components/SiteHeader';
import { Footer } from '../../../components/Footer';

export const metadata = { title: 'Terms of Service — Emergency AI' };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pt-20 pb-28 sm:pt-28">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">LEGAL</div>
        <h1 className="mt-4 font-serif text-5xl font-medium leading-tight text-emrg-ink">Terms of Service</h1>
        <p className="mt-3 text-[12px] text-emrg-mute">Effective 1 January 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-emrg-ink/90">
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">1. Acceptance</h2>
            <p className="mt-3">By accessing or using Emergency AI ("the Platform"), you agree to be bound by these Terms. If you do not agree, do not use the Platform.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">2. Accounts</h2>
            <p className="mt-3">You are responsible for safeguarding your credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">3. Subscriptions and payment</h2>
            <p className="mt-3">Paid plans are billed monthly through Stripe. Subscriptions renew automatically until canceled. Cancellation takes effect at the end of the current billing period; no pro-rata refunds are offered for partial periods unless required by law.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">4. Generated content</h2>
            <p className="mt-3">You own the output you produce through the Platform, subject to the rights of any third-party model providers as disclosed in their respective terms. You are responsible for ensuring that prompts, seed assets, and resulting media do not infringe third-party rights or violate applicable law.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">5. Acceptable use</h2>
            <p className="mt-3">You may not use the Platform to produce content that is unlawful, that impersonates a real person without consent, that depicts minors in sexual contexts, or that is intended to harass, defraud, or deceive. We may suspend or terminate accounts that violate these limits.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">6. Service availability</h2>
            <p className="mt-3">We aim for high availability but the Platform is provided on an as-is basis without warranty of uninterrupted service. Scheduled maintenance windows are announced in advance where reasonably possible.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">7. Limitation of liability</h2>
            <p className="mt-3">To the maximum extent permitted by law, the Platform's aggregate liability shall not exceed the amount paid by you in the twelve months preceding the claim. We are not liable for indirect or consequential damages.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">8. Changes to these Terms</h2>
            <p className="mt-3">We may update these Terms from time to time. Material changes will be notified to active accounts before they take effect.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">9. Contact</h2>
            <p className="mt-3">Questions about these Terms: legal@emergency.ai</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
