'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Database } from 'lucide-react';

interface Health {
  implementation: string;
  implementationVersion: string;
  status: 'ok' | 'degraded' | 'down';
  seeded: boolean;
  degraded: boolean;
}

export function KnowledgeStatusBanner() {
  const [h, setH] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/knowledge/health', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: Health) => { if (!cancelled) setH(j); })
      .catch(() => { /* surface silently — banner hides if probe fails */ });
    return () => { cancelled = true; };
  }, []);

  if (!h) return null;

  // No provider configured — Tier 00 is offline. Honest degradation.
  if (h.implementation === 'no-provider' || h.status === 'down') {
    return (
      <div className="mb-6 rounded-md border border-amber-400/30 bg-amber-400/[0.05] px-4 py-3 text-[12px] leading-relaxed text-amber-200/95">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div>
            <div className="font-medium text-amber-100">
              Institutional knowledge provider unavailable.
            </div>
            <p className="mt-1 text-amber-200/80">
              Briefings and intelligence comparisons against institutional doctrine are degraded. External signal acquisition and on-demand briefings still operate; doctrine citations will be omitted from this deployment until a Tier 00 provider (Veritas OS or the reference implementation) is configured.
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-amber-300/70">
              env · KNOWLEDGE_PROVIDER=none
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Reference provider running — useful for development; not Veritas OS.
  if (h.implementation === 'intel-knowledge-reference') {
    return (
      <div className="mb-6 rounded-md border border-cyan-400/25 bg-cyan-400/[0.04] px-4 py-3 text-[12px] leading-relaxed text-cyan-100/95">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
          <div>
            <div className="font-medium text-cyan-100">
              Knowledge provider: reference implementation.
            </div>
            <p className="mt-1 text-cyan-100/75">
              <code className="font-mono text-[11px]">{h.implementation}@{h.implementationVersion}</code> — lexical retrieval against an in-memory corpus. Suitable for development and integration testing. <strong>Production deployments must run Veritas OS.</strong>
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300/70">
              <span>contract · tier00.knowledge-provider</span>
              <span>status · {h.status}</span>
              <span>seeded · {h.seeded ? 'yes' : 'pending'}</span>
            </div>
            <Link href="/console/intelligence" className="mt-2 inline-flex text-[11px] uppercase tracking-[0.22em] text-cyan-200 hover:text-emrg-ink">
              Open intelligence surface →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Veritas OS (or any future production provider) running — quiet badge.
  return null;
}
