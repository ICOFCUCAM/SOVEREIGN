# Sovereign Dispatch — Art Direction Engine

An autonomous image-generation pipeline that produces an institutional
illustration library which looks as if one elite design studio made it. **No
prompt is ever handwritten.** Every prompt is composed from layered
configuration; every scene is generated as multiple candidates, scored 0–100
against weighted criteria, continuity-checked against the approved set, and the
best (above threshold) is selected — otherwise the prompt is refined
programmatically and regenerated.

```
Brand DNA · Style · Camera · Lighting · Composition · Scene · Quality · Negative
                              ↓ (Prompt Composer)
                         Final prompt
                              ↓ (Image Provider)
                    N candidate images
                              ↓ (Scorer)
              0–100 per criterion + flags  ─┐
                              ↓ (Selector)   │ below threshold →
                    best candidate           │ Refinement Engine → recompose
                              ↓ (Continuity)  │ (architecture↑, people↓,
                  matches the approved set? ──┘  lighting↑, simplify framing…)
                              ↓
                   in_review → human approve → Library → export
```

## Modules (`src/`)

| Module | Responsibility |
|---|---|
| `config/loadConfig.ts` | Loads the 7 immutable config layers + scene cards |
| `engines/promptComposer.ts` | Assembles every layer into one prompt (never handwritten) |
| `engines/refinement.ts` | Rule-based prompt mutation from weak criteria |
| `engines/selector.ts` | Ranks candidates; accepts top if ≥ threshold and unflagged |
| `engines/continuity.ts` | Rejects images that break the set's grade/lighting |
| `providers/*` | `ImageProvider` abstraction — `mock`, `openai` (gpt-image-1) |
| `scoring/*` | `Scorer` abstraction — `mock`, `vision` (gpt-4o) + rubric math |
| `library/imageLibrary.ts` | Per-scene record: prompts, candidates, scores, status, history |
| `orchestrator.ts` | The DI loop: compose → generate → score → select → refine |
| `report.ts` | Static HTML contact sheet (compare candidates / view scores) |
| `cli.ts` | Admin commands (status/next/generate/approve/export/report…) |

## Configuration (`config/*.json`) — everything is editable, nothing hard-coded

`brand.json` · `style.json` · `camera.json` · `lighting.json` ·
`composition.json` · `quality.json` (threshold, maxAttempts, candidatesPerScene,
weighted criteria) · `negative.json` (never-allow tokens).

## Scenes (`scenes/*.json`)

One JSON file per illustration (`scene-01` … `scene-30`). Each carries title,
purpose, story, environment, architecture, people prominence, camera/lighting
preset, composition, materials, objects, scene-specific negatives, continuity
notes and aspect ratio. See `scene-01-government-cabinet.json` for the shape.

## Running it

```bash
npm install && npm run build
npm test                       # 18 offline orchestration tests (mock provider/scorer)

# Admin CLI (offline mock by default — deterministic, free):
node dist/src/cli.js status            # progress across all 30 scenes
node dist/src/cli.js prompt 5          # print the composed prompt for scene 5
node dist/src/cli.js generate 5        # run the pipeline for one scene
node dist/src/cli.js scores 5          # candidate scores
node dist/src/cli.js approve 5         # approve the selected candidate
node dist/src/cli.js export            # copy approved selections → ./export
node dist/src/cli.js report            # write library/report.html
```

### Going live

```bash
export IMAGE_PROVIDER=openai            # gpt-image-1
export SCORER=vision                    # gpt-4o grades each candidate
export OPENAI_API_KEY=sk-...            # (or proxied via Supabase — see below)
node dist/src/cli.js next               # generate the next unapproved scene
```

Generation is **manual / on-demand** — nothing auto-runs. The CLI (and the
`report.html` contact sheet) is the admin surface; trigger a scene only when you
want one, review candidates, then `approve`.

## Extending

- **Add a scene:** drop a new `scenes/scene-NN-*.json` matching the schema. Done.
- **Adjust the look:** edit `config/style.json`, `lighting.json`, `camera.json`,
  or the weights/threshold in `quality.json`. No code change.
- **Add a provider:** implement `ImageProvider` and add a case to
  `providers/registry.ts` (e.g. Gemini, Stability, a sovereign model). The
  orchestration logic is untouched.
- **Add an evaluator:** implement `Scorer` and add a case to
  `scoring/registry.ts`.

## Output layout

```
output/<scene-id>/*.png|svg   generated candidates
library/records.json          full metadata + scores + revision history
library/report.html           contact sheet
export/<scene-id>.<ext>       approved selections, ready to place
```
