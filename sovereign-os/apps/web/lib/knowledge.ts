import 'server-only';
import { NoProvider, type KnowledgeProvider } from '@sovereign/intel-knowledge-contract';
import { ReferenceKnowledgeProvider } from '@sovereign/intel-knowledge-reference';

// Knowledge Provider factory for Emergency AI.
//
// Selection (env): KNOWLEDGE_PROVIDER
//   - 'none'      (default) → NoProvider; the console surfaces a banner
//                              that doctrine is unavailable.
//   - 'reference'           → ReferenceKnowledgeProvider, seeded with a
//                              small sample doctrine set so the surface
//                              has something to display. Use for
//                              development and integration tests only.
//   - 'veritas'             → reserved for the Veritas OS production
//                              implementation. Not wired yet — falls
//                              back to NoProvider.
//
// Module-scoped singleton so the in-memory reference store persists for
// the lifetime of the server process.

let cached: KnowledgeProvider | undefined;
let cachedSeeded = false;

export function getKnowledgeProvider(): KnowledgeProvider {
  if (cached) return cached;

  const choice = (process.env.KNOWLEDGE_PROVIDER ?? 'none').toLowerCase();
  switch (choice) {
    case 'reference': {
      const p = new ReferenceKnowledgeProvider();
      cached = p;
      void seedReference(p).then(() => { cachedSeeded = true; });
      return cached;
    }
    case 'veritas':
      // Production Veritas OS adapter is not wired in this sprint.
      console.warn('[knowledge] KNOWLEDGE_PROVIDER=veritas requested but Veritas OS adapter is not implemented; falling back to NoProvider.');
      cached = NoProvider;
      return cached;
    case 'none':
    default:
      cached = NoProvider;
      return cached;
  }
}

export function isReferenceSeeded(): boolean {
  return cachedSeeded;
}

// Seed a handful of representative doctrine documents so the console
// has something to render. Reference-only convenience.
async function seedReference(p: ReferenceKnowledgeProvider): Promise<void> {
  const principal = {
    tenantId: 'reference-demo',
    principalId: 'system-seed',
    roles: ['service' as const],
    clearance: 'internal',
  };

  await p.ingest(principal, {
    title: 'Crisis Response Doctrine v1',
    kind: 'doctrine',
    body: 'The institution responds to a declared crisis through a ministerial briefing within four hours of detection.\n\nEvery decision taken during a crisis is recorded under audit, with the responsible principal and the rationale captured.\n\nThe Communications Lead is notified before the first public statement.',
    classification: 'internal',
    jurisdiction: 'pt',
  });

  await p.ingest(principal, {
    title: 'Executive Briefing Standard',
    kind: 'doctrine',
    body: 'Executive briefings carry the institutional house register and are signed by the Communications Lead.\n\nEach briefing cites its sources and notes the confidence of its claims.',
    classification: 'internal',
    jurisdiction: 'pt',
  });

  await p.ingest(principal, {
    title: 'Procurement Procedure (Excerpt)',
    kind: 'procedure',
    body: 'All procurements above five million euro require board sign-off and a competitive tendering process not shorter than thirty days.\n\nVendor diligence reports are retained for seven years.',
    classification: 'internal',
    jurisdiction: 'pt',
  });
}
