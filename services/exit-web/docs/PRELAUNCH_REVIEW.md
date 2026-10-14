# Pre-launch review list

These features were restored to the site on 14 October 2026 at the owner's instruction: rich features stay while the product is being built. Each one is checked before Stripe payments go live: either wired to the real backend or reworded.

Code markers: `grep -rn PRELAUNCH-REVIEW services/exit-web/src`.

| Page | Restored feature | Backend state today | To do before launch |
|---|---|---|---|
| Sign-in | Continue with Google / Apple / Microsoft | Real: Supabase OAuth redirect | Turn on each provider in Supabase Auth (Apple needs an Apple Developer account) |
| Sign-in | E-mail + password, Forgot password | Real: Supabase password grant and recover | Turn on e-mail/password sign-up and set an SMTP sender |
| The Banker | "Working the deal · live", activity feed (2h/5h/1d…), funnel contacted / interested / diligence, Approve next step | Feed and funnel counts are computed from the buyer ranking, not from real buyer replies | Feed from real outreach events, or reword |
| The Banker | Send introduction | Opens the user's mail app with the drafted introduction | Optional: send from the platform |
| The Banker | Send (deliver to the buyer's data room) | Shows "Delivered"; nothing is uploaded | Upload into the buyer's data room |
| Marketplace | Publish Opportunity: five-step run, "Live · N buyers in outreach", "Published to marketplace" | Steps are built from real engine artefacts; nothing is published or sent | Publish through the listing API and an outreach queue |
| Marketplace | Request NDA (public view) | Opens the Acquisition Radar, where buyers request NDAs | — |
| Enterprise Value | Blended headline (baseline, DCF and comparables averaged); Comparable transactions bar | Computed | Review the method with a valuation adviser |
| Closing Center | Schedule (closing call); "dial-in issued with the invite"; "tracks every signature, escrow movement and filing, and nudges the owner" | The invite .ics is real; no dial-in, tracking or reminders | Calendar and dial-in integration; reminders |
| Active Processes | Stage-conversion benchmarks; automation wording | Static benchmarks | Source them |
| Admin Console | Platform health panel | Static values | Live health checks |
| Process Intelligence | Live market ticker | Registry snapshot, animated | Live feed |
| Diligence | Re-run analysis | Re-renders the checks (they recompute from the profile) | — |
| Inbox | Buyer-demand description | Copy | Review the wording |
| Listing desk | Identity verification (BankID and other national eIDs, Stripe Identity) | Real: `exit-identity` function and a database gate on listings, deployed and self-tested; every method shows "Not yet available" until its credentials are set | Set `STRIPE_SECRET_KEY`; sign a broker (Criipto or Signicat) and set its four `IDENTITY_*` settings; register the redirect URI; run one real verification end to end |
| Sign-in | Continue with LinkedIn | Real: Supabase OAuth redirect (`linkedin_oidc`) | Create a LinkedIn app and turn on the provider in Supabase Auth |
| Listing desk | "Mark this session verified for testing" | Development builds without a server account only; changes nothing on the server | — (never present with e-mail sign-in) |
