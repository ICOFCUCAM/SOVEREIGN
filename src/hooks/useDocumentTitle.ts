import { useEffect } from 'react';

const BASE = 'SOVEREIGN';
const DEFAULT_DESC = 'Sovereign-grade domain intelligence, AI-native deployment infrastructure, and deployable digital institutions — at planetary scale.';

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

/** Sets the document title (and optionally the meta description) per route, restoring on unmount. */
export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? DEFAULT_DESC;
    document.title = title ? `${title} — ${BASE}` : `${BASE} — The operating layer for digital civilization`;
    if (description) setMeta('description', description);
    return () => { document.title = prevTitle; setMeta('description', prevDesc); };
  }, [title, description]);
}
