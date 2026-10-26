import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { BRAND } from "@/lib/tools";

// The frame for signing in, creating an account and resetting a password: the
// hero's dark, lit stage on one side (a compact band on phones) and a calm form
// on the other, with a way back to the site. The promises listed are the ones
// the Security & Governance page makes.
const PROMISES = [
  "Everything you create is yours, commercially and permanently.",
  "Private by default. Nothing is public until you publish or share it.",
  "Export to print-ready PDF, DOCX or EPUB at any time.",
];

const PILLARS = [
  { label: "Career", color: "bg-career" },
  { label: "Publishing", color: "bg-publishing" },
  { label: "Education", color: "bg-educational" },
  { label: "Marketplace", color: "bg-marketplace" },
];

const STAGE = { background: "radial-gradient(120% 90% at 50% -10%, hsl(222 47% 12%) 0%, hsl(222 47% 7%) 45%, hsl(224 60% 4%) 100%)" };

export const GradientText = ({ children }: { children: ReactNode }) => (
  <span className="bg-gradient-to-r from-[hsl(217_91%_70%)] via-[hsl(245_85%_74%)] to-[hsl(280_85%_74%)] bg-clip-text pr-1 italic text-transparent">{children}</span>
);

const AuthLayout = ({ eyebrow, headline, lede, children }: { eyebrow: string; headline: ReactNode; lede?: ReactNode; children: ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-background lg:flex-row">
    {/* The stage */}
    <section className="relative isolate overflow-hidden text-white lg:flex lg:w-[46%] lg:flex-col" style={STAGE}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[30rem] w-[30rem] animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/25 blur-[120px]" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-[26rem] w-[26rem] animate-glow-pulse rounded-full bg-[hsl(262_83%_58%)]/25 blur-[120px]" style={{ animationDelay: "2s" }} />
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(100% 70% at 30% 30%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(100% 70% at 30% 30%, #000 30%, transparent 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(262_83%_64%)]/60 to-transparent" />

      <div className="relative flex flex-1 flex-col px-6 py-6 sm:px-10 lg:px-14 lg:py-10">
        <Link to="/" className="inline-flex items-center gap-2.5 self-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40" aria-label={`${BRAND} home`}>
          <img src="/logo-mark.png" alt="" className="h-8 w-auto" width={47} height={32} />
          <span className="font-serif text-lg font-semibold tracking-tight">{BRAND}</span>
        </Link>

        <div className="mt-8 max-w-md lg:my-auto lg:mt-0 lg:py-12">
          <div className="mb-5 hidden flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur sm:inline-flex">
            {PILLARS.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/70">
                <span className={`h-1.5 w-1.5 rounded-full ${p.color}`} /> {p.label}
              </span>
            ))}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">{eyebrow}</p>
          <h1 className="text-display mt-3 text-[2rem] font-bold leading-[1.08] sm:text-4xl lg:text-[2.85rem]">{headline}</h1>
          {lede && <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">{lede}</p>}
          <ul className="mt-8 hidden space-y-3 lg:block">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-white/70">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15"><Check className="h-3 w-3" /></span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 hidden text-xs text-white/35 lg:block">Create. Localize. Publish. Sell. One platform, every language.</p>
      </div>
    </section>

    {/* The form */}
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 lg:px-16">
      <Link to="/" className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {BRAND}
      </Link>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      <p className="text-center text-xs text-muted-foreground">
        <Link to="/security" className="underline-offset-2 hover:text-foreground hover:underline">Security & privacy</Link>
        <span className="mx-2" aria-hidden>·</span>
        <Link to="/accessibility" className="underline-offset-2 hover:text-foreground hover:underline">Accessibility</Link>
      </p>
    </main>
  </div>
);

export default AuthLayout;
