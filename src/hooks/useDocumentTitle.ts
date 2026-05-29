import { useEffect } from 'react';

const BASE = 'SOVEREIGN';
const DEFAULT_DESC = 'Sovereign-grade domain intelligence, AI-native deployment infrastructure, and deployable digital institutions — at planetary scale.';

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function setProp(prop: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

/** Sets the document title, meta + OG description, and a canonical link per route. Restores on unmount. */
export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? DEFAULT_DESC;
    const prevCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? '';
    const full = title ? `${title} — ${BASE}` : `${BASE} — The operating layer for digital civilization`;
    document.title = full;
    setProp('og:title', full);
    setProp('og:type', 'website');
    setProp('og:url', typeof window !== 'undefined' ? window.location.href : '');
    setMeta('twitter:title', full);
    setMeta('twitter:card', 'summary_large_image');
    if (description) {
      setMeta('description', description);
      setProp('og:description', description);
      setMeta('twitter:description', description);
    }
    if (typeof window !== 'undefined') setCanonical(window.location.origin + window.location.pathname);
    return () => {
      document.title = prevTitle;
      setMeta('description', prevDesc);
      setProp('og:description', prevDesc);
      setProp('og:title', prevTitle);
      if (prevCanonical) setCanonical(prevCanonical);
    };
  }, [title, description]);
}
