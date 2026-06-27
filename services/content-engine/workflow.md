# Editorial workflow

Every topic moves through a state machine. Transitions are recorded in the
topic's `history[]` (who/when/why) — the same governance discipline the product
itself enforces on documents.

```
idea ──▶ queued ──▶ drafting ──▶ in_review ──▶ approved ──▶ published ──▶ live
                                     │                                      │
                                     ▼ (reject)                            ▼ (review due)
                                   idea                                 needs_refresh ──▶ drafting
                                                                            │
                                                                            ▼ (deprecate)
                                                                         retired
```

| State | Meaning | Set by |
|---|---|---|
| `idea` | captured, not yet scheduled | human / discovery |
| `queued` | accepted into the backlog | human (`topic add`) |
| `drafting` | authoring in progress | `pipeline` |
| `in_review` | AI draft ready, awaiting human sign-off | `pipeline` (review gate) |
| `approved` | human approved for publication | `review --approve` |
| `published` | spliced into the site data + sitemap | `pipeline --autopublish` / `merge` |
| `live` | indexed and serving | publish + index confirmation |
| `needs_refresh` | evergreen review due (`reviewEveryDays`) | `refresh-due` |
| `retired` | deprecated / redirected | human |

**Human review is mandatory by default.** `pipeline` stops at `in_review`; only
an explicit `review --approve` (or `--autopublish` with a passing quality+fact
gate) advances a topic to publication. Fact-verification failures block
publication regardless of score.
