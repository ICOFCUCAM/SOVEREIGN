import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveDocument, updateDocument, type DocKind } from "@/lib/documents";

// Draft auto-save for the creation studios — so a refresh, crash, lost
// connection, accidental close, logout, or interrupted AI run never loses work.
//
// Two layers, on purpose:
//  1. Local snapshot — written to localStorage on every change (and on unload).
//     Instant, offline-safe, survives a browser crash. This is the guarantee.
//  2. Server checkpoint — throttled save into the library via the polished_*
//     RPCs, so the draft is durable across devices / a cleared cache and shows
//     up under Library → Drafts. Best-effort: if the user is signed out or
//     offline it silently falls back to the local snapshot and retries later.
//
// The consumer initialises its own React state from readDraft(key) (so there is
// no empty-flash and the first persisted value equals what was restored — no
// clobber), then feeds the live snapshot back in here.

const NS = "pp:draft:";
const keyFor = (k: string) => `${NS}${k}`;

interface Stored<T> { data: T; docId: string | null; savedAt: number | null }

// Synchronously read a saved draft. Call from a lazy useState/useRef initialiser.
export function readDraft<T>(key: string): { data: T; docId: string | null } | null {
  try {
    const s = localStorage.getItem(keyFor(key));
    if (!s) return null;
    const parsed = JSON.parse(s) as Stored<T>;
    if (!parsed || typeof parsed !== "object" || !("data" in parsed)) return null;
    return { data: parsed.data, docId: parsed.docId ?? null };
  } catch { return null; }
}

export type AutosaveStatus = "idle" | "saving" | "saved" | "local";

export interface DraftAutosave {
  status: AutosaveStatus;
  lastSavedAt: number | null;
  docId: string | null;
  flush: () => Promise<void>; // force a server checkpoint now
  discard: () => void;        // clear local + forget the server draft (e.g. "New")
}

export function useDraftAutosave<T>(opts: {
  storageKey: string;
  data: T;
  initialDocId?: string | null;
  // Only checkpoint to the server once the draft is worth keeping.
  hasContent: (d: T) => boolean;
  // Map the live draft to a library document, or null to skip this cycle.
  toDocument: (d: T) => { kind: DocKind; title: string; payload: unknown; preview?: string } | null;
  serverIntervalMs?: number;
}): DraftAutosave {
  const { storageKey, data, hasContent, toDocument } = opts;
  const interval = opts.serverIntervalMs ?? 60_000;

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const docIdRef = useRef<string | null>(opts.initialDocId ?? null);

  const serialize = useCallback((d: T) => { try { return JSON.stringify(d); } catch { return ""; } }, []);

  // Last value we wrote to each layer, so we don't churn on no-op renders.
  const lastLocalRef = useRef<string>(serialize(data));
  // If we already have a server doc, assume it holds the current snapshot.
  const lastServerRef = useRef<string>(docIdRef.current ? serialize(data) : "");
  const dataRef = useRef<T>(data);
  dataRef.current = data;

  const writeLocal = useCallback((d: T) => {
    try {
      const payload: Stored<T> = { data: d, docId: docIdRef.current, savedAt: lastSavedAt };
      localStorage.setItem(keyFor(storageKey), JSON.stringify(payload));
      lastLocalRef.current = serialize(d);
    } catch { /* quota / private mode — the server layer is the backup */ }
  }, [storageKey, lastSavedAt, serialize]);

  // Layer 1: debounced local snapshot on every change.
  useEffect(() => {
    const cur = serialize(data);
    if (cur === lastLocalRef.current) return;
    const t = window.setTimeout(() => writeLocal(data), 500);
    return () => window.clearTimeout(t);
  }, [data, serialize, writeLocal]);

  const flush = useCallback(async () => {
    const d = dataRef.current;
    if (!hasContent(d)) return;
    const cur = serialize(d);
    if (cur === lastServerRef.current) return; // nothing new since last checkpoint
    const doc = toDocument(d);
    if (!doc) return;
    setStatus("saving");
    try {
      if (docIdRef.current) {
        await updateDocument(docIdRef.current, doc.payload, doc.preview);
      } else {
        docIdRef.current = await saveDocument({ kind: doc.kind, title: doc.title, payload: doc.payload, preview: doc.preview });
      }
      lastServerRef.current = cur;
      const now = Date.now();
      setLastSavedAt(now);
      setStatus("saved");
      writeLocal(d); // persist the new docId/savedAt into the local snapshot too
    } catch {
      // Signed out, offline, or transient — the local snapshot still holds it.
      setStatus("local");
    }
  }, [hasContent, toDocument, serialize, writeLocal]);

  // Layer 2: periodic server checkpoint, plus a retry when connectivity returns.
  useEffect(() => {
    const id = window.setInterval(() => { void flush(); }, interval);
    const onOnline = () => { void flush(); };
    window.addEventListener("online", onOnline);
    return () => { window.clearInterval(id); window.removeEventListener("online", onOnline); };
  }, [flush, interval]);

  // Final synchronous local write if the page is closing mid-debounce.
  useEffect(() => {
    const onUnload = () => {
      const d = dataRef.current;
      if (serialize(d) !== lastLocalRef.current) writeLocal(d);
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [serialize, writeLocal]);

  const discard = useCallback(() => {
    try { localStorage.removeItem(keyFor(storageKey)); } catch { /* ignore */ }
    docIdRef.current = null;
    lastLocalRef.current = "";
    lastServerRef.current = "";
    setStatus("idle");
    setLastSavedAt(null);
  }, [storageKey]);

  return useMemo(() => ({ status, lastSavedAt, docId: docIdRef.current, flush, discard }), [status, lastSavedAt, flush, discard]);
}
