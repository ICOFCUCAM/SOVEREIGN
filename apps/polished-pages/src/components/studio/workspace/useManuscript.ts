import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Manuscript, Section } from "@/lib/manuscript";
import type { StudioBackend } from "@/lib/studio-backend";

// The project's book: loaded once, saved a moment after each change, and
// saved at once before Claude works on it (so Claude reads what is on screen).
export function useManuscript(backend: StudioBackend, id: string) {
  const { toast } = useToast();
  const [m, setM] = useState<Manuscript | null | undefined>(undefined);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const latest = useRef<Manuscript | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let live = true;
    backend.manuscript(id).then((x) => { if (live) { setM(x); latest.current = x; } })
      .catch((e) => { if (live) { setM(null); toast({ title: "Couldn't open the book", description: e instanceof Error ? e.message : "", variant: "destructive" }); } });
    return () => { live = false; if (timer.current) window.clearTimeout(timer.current); };
  }, [backend, id, toast]);

  const persist = useCallback(async () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
    if (!latest.current) return;
    setSaving("saving");
    try { await backend.saveManuscript(id, latest.current); setSaving("saved"); }
    catch (e) { setSaving("idle"); toast({ title: "Couldn't save the book", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  }, [backend, id, toast]);

  /** Replaces the book and saves it shortly. */
  const update = useCallback((next: Manuscript) => {
    setM(next); latest.current = next; setSaving("idle");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void persist(); }, 1200);
  }, [persist]);

  /** Changes one section, always against the newest version of the book. */
  const patchSection = useCallback((sectionId: string, patch: Partial<Section>) => {
    const cur = latest.current; if (!cur) return;
    update({ ...cur, sections: cur.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)) });
  }, [update]);

  /** Starts (or replaces) the book and saves it straight away. */
  const replace = useCallback(async (next: Manuscript) => { setM(next); latest.current = next; await persist(); }, [persist]);

  return { m, update, patchSection, replace, persist, saving, latest };
}
