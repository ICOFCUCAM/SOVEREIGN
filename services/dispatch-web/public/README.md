# dispatch-web public assets

## `Dispatchhero.png` — landing hero artwork (REQUIRED)

The marketing landing (`/`) uses a full-bleed hero background at
`/Dispatchhero.png`. Drop the artwork here:

```
services/dispatch-web/public/Dispatchhero.png
```

**Spec**
- Subject anchored to the **right** (globe + document covers); the left ~45%
  reads as dark/empty — the page lays a left-to-right `#070707` gradient over it
  so the headline stays legible. The page also feathers the top and bottom edges.
- Recommended ~1774×887 (16:8-ish), dark background, gold/amber accent to match
  the institutional theme.
- A temporary dark-glow placeholder of the same name may exist locally; it is
  git-ignored. Replace it with the real artwork, then it can be committed.

Once the real file is in place, remove the ignore line in
`services/dispatch-web/.gitignore` so the asset ships with the app.
