import { useEffect } from 'react';

const BASE = 'SOVEREIGN';

/** Sets the document title to "<title> — SOVEREIGN", restoring on unmount. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — ${BASE}` : `${BASE} — The operating layer for digital civilization`;
    return () => { document.title = prev; };
  }, [title]);
}
