import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Manuscript, Section } from "@/lib/manuscript";
import type { StudioBackend } from "@/lib/studio-backend";
import { maybeAutosave } from "@/lib/section-versions";

export type SaveState = "idle" | "saving" | "saved" | "error";
/** Unsaved changes kept on this device until the server has them (design spec §6 recovery). */
export interface LocalCopy { at: string; manuscript: Manuscript }

const UNDO_LIMIT = 200;
/** Typing within this long is one undo step. */
const COALESCE_MS = 1000;
const backupKey = (id: string) => `studio.unsaved.${id}`;

export function readLocalCopy(id: string): LocalCopy | null {
  try { const raw = localStorage.getItem(backupKey(id)); return raw ? (JSON.parse(raw) as LocalCopy) : null; } catch { return null; }
}
const writeLocalCopy = (id: string, m: Manuscript) => { try { localStorage.setItem(backupKey(id), JSON.stringify({ at: new Date().toISOString(), manuscript: m })); } catch { /* storage full or blocked */ } };
const clearLocalCopy = (id: string) => { try { localStorage.removeItem(backupKey(id)); } catch { /* blocked */ } };
const same = (a: Manuscript, b: Manuscript) => JSON.stringify({ ...a, updatedAt: undefined }) === JSON.stringify({ ...b, updatedAt: undefined });

/** Keeps an autosaved revision of each section whose text changed (at most every ten minutes). */
function withAutosaves(prev: Manuscript | null, next: Manuscript): Manuscript {
  if (!prev) return next;
  const before = new Map(prev.sections.map((s) => [s.id, s]));
  let changed = false;
  const sections = next.sections.map((s) => {
    const p = before.get(s.id);
    if (!p || p.body === s.body || p.versions !== s.versions) return s;
    const kept = maybeAutosave(p);
    if (kept === p) return s;
    changed = true;
    return { ...s, versions: kept.versions };
  });
  return changed ? { ...next, sections } : next;
}

// The project's book: loaded once, saved a moment after each change, and
// saved at once before Claude works on it (so Claude reads what is on screen).
// Every change can be undone and redone, independently of Claude's history;
// unsaved changes are kept on this device until the server confirms them.
export function useManuscript(backend: StudioBackend, id: string) {
  const { toast } = useToast();
  const [m, setM] = useState<Manuscript | null | undefined>(undefined);
  const [saving, setSaving] = useState<SaveState>("idle");
  const [recovery, setRecovery] = useState<LocalCopy | null>(null);
  const [, setStacks] = useState(0);
  const latest = useRef<Manuscript | null>(null);
  const timer = useRef<number | null>(null);
  const past = useRef<Manuscript[]>([]);
  const future = useRef<Manuscript[]>([]);
  const lastPush = useRef(0);

  useEffect(() => {
    let live = true;
    past.current = []; future.current = [];
    backend.manuscript(id).then((x) => {
      if (!live) return;
      setM(x); latest.current = x;
      // A copy on this device that the server never received: offer it back.
      const local = readLocalCopy(id);
      if (local && (!x || !same(local.manuscript, x))) setRecovery(local); else if (local) clearLocalCopy(id);
    }).catch((e) => { if (live) { setM(null); toast({ title: "Couldn't open the book", description: e instanceof Error ? e.message : "", variant: "destructive" }); } });
    return () => { live = false; if (timer.current) window.clearTimeout(timer.current); };
  }, [backend, id, toast]);

  const persist = useCallback(async () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
    if (!latest.current) return;
    const sent = latest.current;
    setSaving("saving");
    try {
      await backend.saveManuscript(id, sent);
      if (latest.current === sent) { setSaving("saved"); clearLocalCopy(id); }
    } catch (e) {
      setSaving("error");
      toast({ title: "Couldn't save the book", description: `${e instanceof Error ? e.message : ""} Your changes are kept on this device; the Studio tries again when you retry.`.trim(), variant: "destructive" });
    }
  }, [backend, id, toast]);

  const commit = useCallback((next: Manuscript) => {
    setM(next); latest.current = next; setSaving("idle");
    writeLocalCopy(id, next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void persist(); }, 1200);
  }, [id, persist]);

  /** Replaces the book and saves it shortly; the change is one undo step (typing is grouped). */
  const update = useCallback((next: Manuscript) => {
    const prev = latest.current;
    if (prev) {
      const now = Date.now();
      if (now - lastPush.current > COALESCE_MS || !past.current.length) past.current = [...past.current, prev].slice(-UNDO_LIMIT);
      lastPush.current = now;
      future.current = [];
      setStacks((n) => n + 1);
    }
    commit(withAutosaves(prev, next));
  }, [commit]);

  const undo = useCallback(() => {
    const prev = past.current[past.current.length - 1];
    if (!prev || !latest.current) return false;
    past.current = past.current.slice(0, -1);
    future.current = [latest.current, ...future.current];
    lastPush.current = 0;
    setStacks((n) => n + 1);
    commit(prev);
    return true;
  }, [commit]);

  const redo = useCallback(() => {
    const next = future.current[0];
    if (!next || !latest.current) return false;
    future.current = future.current.slice(1);
    past.current = [...past.current, latest.current];
    lastPush.current = 0;
    setStacks((n) => n + 1);
    commit(next);
    return true;
  }, [commit]);

  /** Changes one section, always against the newest version of the book. */
  const patchSection = useCallback((sectionId: string, patch: Partial<Section>) => {
    const cur = latest.current; if (!cur) return;
    update({ ...cur, sections: cur.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)) });
  }, [update]);

  /** Starts (or replaces) the book and saves it straight away. */
  const replace = useCallback(async (next: Manuscript) => { setM(next); latest.current = next; await persist(); }, [persist]);

  /** Puts back the copy kept on this device (one undo step), or forgets it. */
  const recover = useCallback((use: boolean) => {
    const local = recovery;
    setRecovery(null);
    if (use && local) update(local.manuscript); else clearLocalCopy(id);
  }, [recovery, update, id]);

  return {
    m, update, patchSection, replace, persist, saving, latest,
    undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0,
    recovery, recover,
  };
}
