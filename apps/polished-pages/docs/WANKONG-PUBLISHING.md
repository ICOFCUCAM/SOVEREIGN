# Publishing to the Wankong store

Polished Pages books and storybooks can be published and sold directly on the
[Wankong](https://github.com/ICOFCUCAM/Wankong) store. This is a cross-project
integration: Polished Pages and Wankong are **separate Supabase projects**, so
the bridge is two edge functions that talk over a shared secret.

## How it works

```
Library / Distribution center (browser)
  → exports the book to EPUB, base64-encodes it
  → invokes  polished-publish-to-wankong   (Polished Pages project, JWT verified)
       • reads the seller's email from their JWT
       • gates paid titles behind a paid plan
       • forwards to Wankong with the bridge secret
  → calls    wankong-publish-book           (Wankong project, secret verified)
       • finds the Wankong account by email (publishes only if it exists)
       • uploads the EPUB + cover to the polished_books bucket
       • upserts an ecom_products row (product_type 'Book', status 'active')
  → records the listing in polished.external_listings
```

A title only lands in the store if the user's Polished Pages email already owns
a Wankong account. If it doesn't, the UI prompts them to create one.

## Deployment checklist

Nothing below is in code — these are the one-time setup steps that make the
"Publish to Wankong" button work end-to-end.

### 1. Decide the shared secret

Generate one strong value, e.g. `openssl rand -hex 32`. The **same** value goes
on both projects as the bridge secret.

### 2. Wankong project (`kwvjxinrjjzfzxbkvfsc`)

```bash
# from the Wankong repo
supabase db push                       # runs 003_polished_pages_bridge.sql
supabase functions deploy wankong-publish-book   # verify_jwt=false (config.toml)

supabase secrets set \
  WANKONG_BRIDGE_SECRET="<shared-secret>" \
  WANKONG_SITE_URL="https://<wankong-store-domain>"
# SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically
```

Note the deployed function URL — it looks like
`https://kwvjxinrjjzfzxbkvfsc.supabase.co/functions/v1/wankong-publish-book`.

### 3. Polished Pages project (`qvjdivcdefuprnenedje`)

```bash
# from SOVEREIGN/apps/polished-pages
supabase db push                       # runs 20260620800000_polished_external_listings.sql
supabase functions deploy polished-publish-to-wankong   # verify_jwt=true

supabase secrets set \
  WANKONG_PUBLISH_URL="https://kwvjxinrjjzfzxbkvfsc.supabase.co/functions/v1/wankong-publish-book" \
  WANKONG_BRIDGE_SECRET="<shared-secret>"   # MUST match Wankong's value
```

Optionally set `VITE_WANKONG_STORE_URL` (build-time) to the public store URL
used in the "create a Wankong account" prompt; it defaults to
`https://wankong.app`.

### 4. Smoke test

1. Sign in to Polished Pages with an email that also has a Wankong account.
2. Open a saved book → **Publish** → **Wankong store**, set a price, publish.
3. Confirm it appears in Wankong's eBook Marketplace and that
   `polished.external_listings` has a `wankong` row with `status = 'live'`.
4. Repeat with an email that has **no** Wankong account — you should get the
   "create a Wankong account" prompt, and nothing should be written to the store.

## Out of scope / follow-ups

- **Payments.** Books publish as live, purchasable listings, but money
  settlement remains Wankong's responsibility, and Wankong's checkout is not yet
  wired to a payment processor.
- **File privacy.** Book files land in a **public** `polished_books` bucket
  (matching the app's existing openness). For a paid store, switch to private
  storage + signed download URLs once payments are live.
