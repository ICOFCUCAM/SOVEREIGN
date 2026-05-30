'use client';
import { useEffect, useState } from 'react';
import { ConsoleShell } from '../../../components/ConsoleShell';
import { KnowledgeStatusBanner } from '../../../components/KnowledgeStatusBanner';
import { Sparkles, Loader2 } from 'lucide-react';

interface Health {
  contract: string;
  contractVersion: string;
  implementation: string;
  implementationVersion: string;
  status: 'ok' | 'degraded' | 'down';
  seeded: boolean;
}

interface Citation { documentId: string; versionId: string; anchor?: string; title: string; jurisdiction?: string }
interface GroundedAnswer { answer: string; citations: Citation[]; confidence: number; degraded: boolean }
interface GroundedResponse {
  ok: boolean;
  value?: GroundedAnswer;
  error?: { code: string; message: string };
  provider?: { implementation: string; implementationVersion: string };
}

export default function IntelligenceConsolePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [question, setQuestion] = useState('What is the institutional crisis-response doctrine?');
  const [answer, setAnswer] = useState<GroundedResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/knowledge/health', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setBusy(true);
    setAnswer(null);
    try {
      const r = await fetch('/api/knowledge/grounded', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const j = (await r.json()) as GroundedResponse;
      setAnswer(j);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConsoleShell>
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">INTELLIGENCE · TIER 00 + TIER 01</div>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
          Institutional knowledge surface.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emrg-mute">
          The Tier 00 knowledge provider holds doctrine, procedures and institutional memory. Emergency AI reads from it through the contract; nothing is persisted here.
        </p>
      </div>

      <KnowledgeStatusBanner />

      {/* Provider state panel */}
      <div className="mb-10 rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6">
        <div className="text-[10px] uppercase tracking-[0.24em] text-emrg-mute">Knowledge provider</div>
        {health ? (
          <dl className="mt-4 grid gap-x-10 gap-y-3 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
            <Pair k="Contract"             v={`${health.contract} @ ${health.contractVersion}`} />
            <Pair k="Implementation"       v={`${health.implementation} @ ${health.implementationVersion}`} />
            <Pair k="Status"               v={health.status} />
            <Pair k="Seed"                 v={health.seeded ? 'seeded' : 'pending'} />
          </dl>
        ) : (
          <div className="mt-3 text-[12px] text-emrg-mute">probing…</div>
        )}
      </div>

      {/* Grounded-answer demo */}
      <div className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-emrg-mute">
          <Sparkles className="h-3.5 w-3.5 text-emrg-gold" /> Grounded reference — doctrine probe
        </div>
        <form onSubmit={ask} className="mt-4 flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the institutional knowledge layer…"
            className="flex-1 rounded-md border border-emrg-edge bg-emrg-bg/60 px-4 py-3 text-[14px] text-emrg-ink placeholder:text-emrg-mute focus:border-emrg-dim focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-emrg-cream px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-emrg-bg transition hover:bg-emrg-gold disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Querying…' : 'Probe doctrine'}
          </button>
        </form>

        {answer && !answer.ok && (
          <div className="mt-6 rounded-md border border-amber-400/25 bg-amber-400/[0.04] px-4 py-3 text-[12px] text-amber-100">
            <div className="font-medium text-amber-200">Provider returned an error.</div>
            <p className="mt-1 text-amber-100/85">
              <code className="font-mono text-[11px]">{answer.error?.code}</code> — {answer.error?.message}
            </p>
            {answer.error?.code === 'no_provider' && (
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-amber-300/80">
                Configure KNOWLEDGE_PROVIDER=reference (or wire Veritas OS) to enable doctrine queries.
              </p>
            )}
          </div>
        )}

        {answer?.ok && answer.value && (
          <div className="mt-6 space-y-5">
            <div className="rounded-md border border-emrg-edge bg-emrg-bg/40 p-5">
              <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-emrg-mute">
                <span>Answer</span>
                <span>·</span>
                <span>confidence {(answer.value.confidence * 100).toFixed(0)}%</span>
                {answer.value.degraded && (
                  <span className="rounded border border-amber-300/30 px-2 py-0.5 text-amber-300/90">degraded</span>
                )}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[13px] leading-[1.65] text-emrg-cream">{answer.value.answer}</pre>
            </div>

            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-emrg-mute">Citations ({answer.value.citations.length})</div>
              <ul className="space-y-2 text-[12px]">
                {answer.value.citations.map((c, i) => (
                  <li key={`${c.documentId}-${c.anchor ?? i}`} className="rounded-md border border-emrg-edge bg-emrg-bg/40 px-3 py-2">
                    <div className="font-medium text-emrg-ink">[{i + 1}] {c.title}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-emrg-mute">
                      {c.documentId}@{c.versionId.slice(0, 8)}{c.anchor ? ` · ${c.anchor}` : ''}{c.jurisdiction ? ` · ${c.jurisdiction}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {answer.value.degraded && (
              <p className="text-[11px] leading-relaxed text-emrg-mute">
                <strong>Why degraded:</strong> the reference provider stitches the top matching excerpts together. It does not run an LLM to synthesise an answer. Citations are real; the prose is concatenation. Veritas OS production replaces this with grounded synthesis.
              </p>
            )}
          </div>
        )}
      </div>
    </ConsoleShell>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.22em] text-emrg-mute">{k}</dt>
      <dd className="mt-1 font-mono text-[12px] text-emrg-ink">{v}</dd>
    </div>
  );
}
