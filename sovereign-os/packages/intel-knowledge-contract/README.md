# @sovereign/intel-knowledge-contract

**Tier 00 Knowledge Provider Contract** for the Sovereign Strategic
Intelligence Infrastructure.

This package defines the institutional knowledge surface that Emergency
AI (Tier 01+) consumes. The contract is the integration boundary between
Emergency AI and the institutional knowledge layer — initially a
reference provider, ultimately the Veritas OS flagship.

Emergency AI never persists institutional doctrine. It references it
through this contract.

## Contract identity

```
contract: tier00.knowledge-provider
version:  0.1.0
```

The contract is a versioned interface. Implementations declare which
version they satisfy via `provider.meta.{contract, version}`.

## Capability groups

| Group | Methods | Purpose |
|---|---|---|
| `documents`   | `retrieve`, `list`, `resolveExcerpt` | Direct access to institutional documents |
| `reference`   | `search`, `similarTo`, `groundedAnswer` | Semantic retrieval and citation-grounded answers |
| `doctrine`    | `doctrineFor`, `precedentFor` | Doctrine and precedent surfaces |
| `graph`       | `resolve`, `neighbours`, `relationship` | Institutional entity graph |
| `memory`      | `recordEvent`, `recordDecision`, `recordOutcome` | Write-side: operational record capture |
| `governance`  | `classify`, `accessFor`, `auditTrail` | Classification, access verdicts, audit |

## Calling convention

Every method is async. Every method returns a `Result<T>` envelope —
either `{ ok: true, value }` or `{ ok: false, error: KnowledgeError }`.
Providers must not throw for contract failures; throws are reserved for
programmer errors.

Every call that touches sensitive data takes a `PrincipalContext`. The
provider is the authority on principal access — callers pass identity
and trust the verdict.

```ts
import type { KnowledgeProvider, PrincipalContext } from '@sovereign/intel-knowledge-contract';

async function brief(provider: KnowledgeProvider, p: PrincipalContext) {
  const r = await provider.doctrine.doctrineFor(p, 'crisis_response');
  if (!r.ok) {
    // Honest degradation. r.error.code may be 'no_provider',
    // 'access_denied', 'provider_unavailable', etc.
    return { degraded: true, reason: r.error.code };
  }
  return { degraded: false, doctrine: r.value };
}
```

## Degradation

Emergency AI must treat the absence of a provider as a first-class
state. The package ships a `NoProvider` implementation that returns
`no_provider` on every method:

```ts
import { NoProvider } from '@sovereign/intel-knowledge-contract';

const provider = chooseProvider() ?? NoProvider;
```

Downstream code reads the same Result envelope and degrades the
surface honestly: briefings still render, alerts still fire, the
console surfaces a banner that doctrine comparison is unavailable.

## Conformance testing

Every provider implementation must pass the reusable contract test
suite:

```js
import { runContractTests } from '@sovereign/intel-knowledge-contract/test-suite';
import { MyProvider } from './my-provider.js';

runContractTests(MyProvider, {
  principal: { tenantId: 't', principalId: 'p', roles: ['operator'] },
  seedDocumentId: 'doc-1',
  seedEntityId:   'ent-1',
});
```

The suite asserts structural compliance: capability presence, Result
envelopes, principal handling. It does not assess substrate quality —
that is the implementation's own test suite.

## Versioning

The contract follows semver. Within a major version:

- New optional methods are non-breaking and may be added in minor releases.
- New required methods or breaking signature changes ship under a new major version.
- Implementations declare the version they satisfy via `provider.meta.version`.

## Boundary

This package is **interface-only**. It contains no I/O, no storage, no
network, no inference. Implementations live in separate packages:

- `@sovereign/intel-knowledge-reference` — Phase 0.3 reference provider
- *(Veritas OS production implementation — chartered separately)*
