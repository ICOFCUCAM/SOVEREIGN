import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Manuscript, Section } from "@/lib/manuscript";
import type { StudioBackend } from "@/lib/studio-backend";
import { maybeAutosave } from "@/lib/section-versions";

export type SaveState = "idle" | "saving" | "saved" | "error";
/** Unsaved changes kept on this device until the server has them (design spec §6 recovery). */
export interface LocalCopy { at: string; manuscript: Manuscript }
/** A copy found on this device that differs from the server's book, set aside until the owner decides. */
export interface Recovery extends LocalCopy {
  /** When the server's book was last saved, and how many words each version has. */
  serverAt: string | null; serverWords: number | null; localWords: number;
  /** Restoring: in progress, or failed with the server's reason. The banner stays until the save succeeds. */
  state: "waiting" | "restoring" | "failed"; error?: string;
}

const UNDO_LIMIT = 200;
/** Typing within this long is one undo step. */
const COALESCE_MS = 1000;
const backupKey = (id: string) => `studio.unsaved.${id}`;
/** Where a found copy is set aside, so later edits never overwrite it before the owner decides. */
const recoveryKey = (id: string) => `studio.recovery.${id}`;

export function readLocalCopy(id: string): LocalCopy | null {
  try { const raw = localStorage.getItem(backupKey(id)); return raw ? (JSON.parse(raw) as LocalCopy) : null; } catch { return null; }
}
/**
 * Keeps the book on this device; returns whether it is really kept. Version
 * history is left out if the full book does not fit (the server keeps it).
 */
function writeLocalCopy(key: string, m: Manuscript): boolean {
  const put = (x: Manuscript) => { localStorage.setItem(key, JSON.stringify({ at: new Date().toISOString(), manuscript: x })); };
  try { put(m); return true; } catch { /* too large or blocked: try without history */ }
  try { put({ ...m, sections: m.sections.map(({ versions: _v, ...s }) => s) }); return true; } catch { return false; }
}
const remove = (key: string) => { try { localStorage.removeItem(key); } catch { /* blocked */ } };
const clearLocalCopy = (id: string) => remove(backupKey(id));
const wordsIn = (m: Manuscript) => m.sections.reduce((n, s) => n + (s.body.trim() ? s.body.trim().split(/\s+/).length : 0), 0);
/**
 * Whether two copies hold the same writing. Compares what the owner wrote
 * (titles, text, ideas, notes, rules), not how the server stores it, so a book
 * the server saved and tidied is never reported as unsaved.
 */
export function sameWriting(a: Manuscript, b: Manuscript) {
  const key = (m: Manuscript) => JSON.stringify([m.title ?? "", m.subtitle ?? "", m.author ?? "", m.rules ?? "",
    m.sections.map((s) => [s.id, s.kind, s.title ?? "", s.body ?? "", s.idea ?? "", (s.pageNotes ?? []).filter((n) => n.text.trim()).map((n) => [n.page, n.text])])]);
  return key(a) === key(b);
}

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
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  /** False when this device could not keep a copy (storage full or blocked): the owner is told. */
  const [kept, setKept] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
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
      // A copy on this device that the server never received: set it aside (so new edits cannot overwrite it) and offer it back.
      let found: LocalCopy | null = null;
      try { const r = localStorage.getItem(recoveryKey(id)); found = r ? (JSON.parse(r) as LocalCopy) : null; } catch { found = null; }
      const local = readLocalCopy(id);
      if (local && (!x || !sameWriting(local.manuscript, x))) {
        found = local;
        try { localStorage.setItem(recoveryKey(id), JSON.stringify(local)); } catch { /* it stays under its first key */ }
      }
      if (local) clearLocalCopy(id);
      if (found && x && sameWriting(found.manuscript, x)) { remove(recoveryKey(id)); found = null; }
      if (found) setRecovery({ ...found, serverAt: x?.updatedAt ?? null, serverWords: x ? wordsIn(x) : null, localWords: wordsIn(found.manuscript), state: "waiting" });
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
      setSaveError(null);
      // "Saved" only when what the server confirmed is what is on screen.
      if (latest.current === sent) { setSaving("saved"); clearLocalCopy(id); }
      return true;
    } catch (e) {
      const why = e instanceof Error && e.message ? e.message : "The server did not confirm the save.";
      setSaving("error"); setSaveError(why);
      toast({ title: "Couldn't save the book", description: `${why} ${writeLocalCopy(backupKey(id), sent) ? "Your changes are kept on this device; press Retry to save them." : "This device could not keep a copy either: don't close this tab until it saves."}`, variant: "destructive" });
      return false;
    }
  }, [backend, id, toast]);

  const commit = useCallback((next: Manuscript) => {
    setM(next); latest.current = next; setSaving("idle");
    setKept(writeLocalCopy(backupKey(id), next));
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
  const replace = useCallback(async (next: Manuscript) => { setM(next); latest.current = next; setKept(writeLocalCopy(backupKey(id), next)); await persist(); }, [persist, id]);

  /**
   * Puts back the copy set aside on this device (one undo step) and saves it at
   * once; the copy is forgotten only when the server confirms the save. Or
   * discards it (the caller confirms with the owner first).
   */
  const recover = useCallback(async (use: boolean) => {
    const local = recovery;
    if (!local) return;
    if (!use) { remove(recoveryKey(id)); setRecovery(null); return; }
    setRecovery({ ...local, state: "restoring", error: undefined });
    update(local.manuscript);
    if (await persist()) { remove(recoveryKey(id)); setRecovery(null); }
    else setRecovery({ ...local, state: "failed", error: "The server did not accept the restored book. It is still kept on this device." });
  }, [recovery, update, persist, id]);

  // Leaving with unsaved work: save at once when the tab is hidden, and ask before closing it.
  const unsaved = saving === "error" || saving === "saving" || (saving === "idle" && timer.current !== null);
  useEffect(() => {
    const hide = () => { if (document.visibilityState === "hidden" && timer.current) void persist(); };
    const leave = (e: BeforeUnloadEvent) => { if (unsaved) { e.preventDefault(); e.returnValue = ""; } };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("beforeunload", leave);
    return () => { document.removeEventListener("visibilitychange", hide); window.removeEventListener("beforeunload", leave); };
  }, [persist, unsaved]);

  return {
    m, update, patchSection, replace, persist, saving, latest,
    undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0,
    recovery, recover, kept, saveError,
  };
}
