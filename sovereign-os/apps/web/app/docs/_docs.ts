// Static doc catalogue. Each entry maps to /docs/<slug>.
export interface DocPage {
  slug: string;
  section: string;
  title: string;
  summary: string;
  body: Array<{ heading?: string; paragraphs: string[]; code?: string }>;
}

export const DOCS: DocPage[] = [
  {
    slug: 'getting-started',
    section: 'Getting started',
    title: 'Sign in and run your first film',
    summary: 'From sign-in to a completed production in under five minutes.',
    body: [
      {
        paragraphs: [
          'Emergency AI is the cinematic intelligence layer for institutions and operators. This guide walks you through your first end-to-end production: a multi-scene film generated, narrated, and stitched by the platform.',
        ],
      },
      {
        heading: '1 · Create an account',
        paragraphs: [
          'Visit the sign-in page, pick "Request access", and enter your email and a password. You will receive a confirmation message; click the link, return to sign-in, and enter your credentials.',
        ],
      },
      {
        heading: '2 · Open the studio',
        paragraphs: [
          'From the console, choose Studio. The Produce long film panel takes a brief, breaks it into scenes, and orchestrates image generation, motion synthesis, and narration in a single run.',
        ],
      },
      {
        heading: '3 · Write a brief',
        paragraphs: [
          'A good brief tells the platform the story you want to tell, the tone, and the audience. The orchestrator decomposes it into scenes and chooses imagery; you may upload seed images per scene to direct composition.',
        ],
      },
      {
        heading: '4 · Submit and monitor',
        paragraphs: [
          'Press Produce film. The pipeline writes jobs to the queue and processes them asynchronously. Watch the Recent jobs panel for progress; finished films appear with an Open link.',
        ],
      },
    ],
  },
  {
    slug: 'pipelines',
    section: 'Platform',
    title: 'How the production pipeline works',
    summary: 'Architecture of the script → scenes → renders → stitch flow.',
    body: [
      {
        paragraphs: [
          'The production pipeline runs in four stages, each backed by a discrete edge function and recorded as a pipeline job.',
        ],
      },
      {
        heading: 'Stage 1 — Orchestration',
        paragraphs: [
          'orchestrate-film accepts a free-form brief and a target scene count. It uses a language model to plan scenes (composition, narration, runtime), creates a parent film job, and enqueues child jobs for each scene.',
        ],
      },
      {
        heading: 'Stage 2 — Imagery',
        paragraphs: [
          'For scenes without an operator-supplied seed, generate-image renders a still using gpt-image-1. The resulting URL is attached to the scene job.',
        ],
      },
      {
        heading: 'Stage 3 — Motion',
        paragraphs: [
          'render-video sends each scene to Runway for image-to-video synthesis. poll-video-jobs runs on a schedule, retrieves finished clips, and marks scenes done.',
        ],
      },
      {
        heading: 'Stage 4 — Narration & stitch',
        paragraphs: [
          'generate-narration emits TTS audio. assemble-film, executed by the ffmpeg worker, concatenates the scenes with narration and uploads the result. The parent job transitions to done with a public result URL.',
        ],
      },
    ],
  },
  {
    slug: 'distribution',
    section: 'Platform',
    title: 'Strategic distribution to LinkedIn, X, YouTube',
    summary: 'Configure channel tokens and publish through the sovereign layer.',
    body: [
      {
        paragraphs: [
          'A finished production becomes a campaign; publishing pushes the asset to one or more channels through the platform-managed credentials.',
        ],
      },
      {
        heading: 'Configure channel tokens',
        paragraphs: [
          'Set LINKEDIN_ACCESS_TOKEN and YOUTUBE_ACCESS_TOKEN as Supabase function secrets. Without them the publish action surfaces a clear error rather than silently failing.',
        ],
      },
      {
        heading: 'Publish a campaign',
        paragraphs: [
          'In the campaigns layer, hit the share icon on any draft. post-campaign dispatches to the relevant channel, records the response, and updates the campaign status.',
        ],
      },
    ],
  },
  {
    slug: 'billing',
    section: 'Billing',
    title: 'Subscriptions and plan changes',
    summary: 'Upgrade, downgrade, and manage payment details via Stripe.',
    body: [
      {
        paragraphs: [
          'Emergency AI uses Stripe for subscription billing. Every plan change runs through Checkout or the Customer Portal; webhooks reconcile state into the subscriptions table so the console always reflects the live state.',
        ],
      },
      {
        heading: 'Choose or change a plan',
        paragraphs: [
          'On /console/billing, pick a tier. You will be redirected to Stripe Checkout. After payment, the webhook activates your subscription and you return to the console.',
        ],
      },
      {
        heading: 'Manage payment details',
        paragraphs: [
          'Use Manage billing to open the Stripe Customer Portal. Update card details, download invoices, or cancel at period end.',
        ],
      },
      {
        heading: 'Trial behaviour',
        paragraphs: [
          'Active and trialing subscriptions both grant full access. A canceled subscription retains access until current_period_end.',
        ],
      },
    ],
  },
  {
    slug: 'security',
    section: 'Operations',
    title: 'Security & sovereign isolation',
    summary: 'Tenancy, encryption, and key handling for institutional deployments.',
    body: [
      {
        paragraphs: [
          'Emergency AI runs on the sovereign platform. Customer data is isolated per project; institutional deployments can run in dedicated tenants with their own keys and storage.',
        ],
      },
      {
        heading: 'Data at rest',
        paragraphs: [
          'All persisted state lives in PostgreSQL with row-level security policies that gate access by authenticated user. Media artefacts are stored in object storage with signed URLs.',
        ],
      },
      {
        heading: 'Secrets handling',
        paragraphs: [
          'Provider keys (Stripe, Runway, OpenAI, LinkedIn, YouTube) are stored as edge function secrets, never in the database or the client bundle. Webhook signatures are verified with constant-time comparison.',
        ],
      },
      {
        heading: 'Single-tenant isolation',
        paragraphs: [
          'On the Institutional plan, Emergency AI can be deployed into a dedicated project with isolated compute, storage, and credentials. Contact institutional@emergency.ai for the deployment runbook.',
        ],
      },
    ],
  },
];

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
