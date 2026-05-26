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

/** Sets the document title (and optionally the meta + OG description) per route, restoring on unmount. */
export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? DEFAULT_DESC;
    const full = title ? `${title} — ${BASE}` : `${BASE} — The operating layer for digital civilization`;
    document.title = full;
    setProp('og:title', full);
    if (description) { setMeta('description', description); setProp('og:description', description); }
    return () => { document.title = prevTitle; setMeta('description', prevDesc); setProp('og:description', prevDesc); setProp('og:title', prevTitle); };
  }, [title, description]);
}
