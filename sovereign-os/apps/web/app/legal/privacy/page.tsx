import { SiteHeader } from '../../../components/SiteHeader';
import { Footer } from '../../../components/Footer';

export const metadata = { title: 'Privacy Policy — Emergency AI' };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pt-20 pb-28 sm:pt-28">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">LEGAL</div>
        <h1 className="mt-4 font-serif text-5xl font-medium leading-tight text-emrg-ink">Privacy Policy</h1>
        <p className="mt-3 text-[12px] text-emrg-mute">Effective 1 January 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-emrg-ink/90">
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">1. What we collect</h2>
            <p className="mt-3">Account email, authentication state, your prompts and uploads, generated media, billing metadata supplied by Stripe, and standard request logs. We do not require any other personal information to use the Platform.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">2. How we use it</h2>
            <p className="mt-3">To operate the Platform, process payments, provide support, prevent abuse, and improve the service. Generated media and prompts are stored to render your console history; you may delete jobs from your account at any time.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">3. Subprocessors</h2>
            <p className="mt-3">We use Supabase for hosting and storage, Stripe for payments, OpenAI for language and TTS models, and Runway for video synthesis. Each subprocessor is bound by their own terms, which we vet before integration.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">4. Retention</h2>
            <p className="mt-3">Account data is retained while your account is active. On deletion, account records and associated jobs are removed within thirty days, except where retention is required for legal or accounting purposes.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">5. Your rights</h2>
            <p className="mt-3">You may request access, correction, deletion, or export of your data. Email privacy@emergency.ai with the request and the account email on file.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">6. Security</h2>
            <p className="mt-3">Encryption in transit and at rest; row-level security on all tenant tables; constant-time signature verification on webhooks; secrets are kept out of the client bundle.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-emrg-ink">7. Contact</h2>
            <p className="mt-3">privacy@emergency.ai</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
