import type { MetadataRoute } from 'next';
import { DOCS } from './docs/_docs';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emergency.ai';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE}/`,                lastModified: now, changeFrequency: 'weekly',  priority: 1 },
    { url: `${SITE}/solutions`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/pricing`,         lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE}/docs`,            lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE}/resources`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/security`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/company`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/legal/terms`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE}/legal/privacy`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE}/sign-in`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
  ];
  const docs = DOCS.map((d) => ({
    url: `${SITE}/docs/${d.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  return [...base, ...docs];
}
