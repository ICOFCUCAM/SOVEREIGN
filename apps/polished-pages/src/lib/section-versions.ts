// Version history for one section (design spec §6): named snapshots the owner
// takes, autosaved revisions while they write, the text before every accepted
// Claude change, and the text before every restore, so going back never loses
// newer work.
import type { Manuscript, Section, SectionVersion, VersionKind } from "@/lib/manuscript";

/** How many versions one section keeps; the oldest unnamed ones go first. */
export const MAX_VERSIONS = 40;
/** An autosaved revision is taken at most this often while the owner writes. */
export const AUTOSAVE_EVERY_MS = 10 * 60_000;

export const VERSION_LABEL: Record<VersionKind, string> = {
  snapshot: "Snapshot",
  autosave: "Autosaved",
  "before-accept": "Before Claude's change",
  "before-restore": "Before restoring",
};

const vid = () => `v-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Adds a version unless it would repeat the newest one; trims to MAX_VERSIONS, keeping named snapshots longest. */
export function addVersion(sec: Section, kind: VersionKind, label?: string, at = new Date()): Section {
  const list = sec.versions ?? [];
  const last = list[list.length - 1];
  if (kind !== "snapshot" && last && last.body === sec.body && last.title === sec.title) return sec;
  const v: SectionVersion = { id: vid(), at: at.toISOString(), kind, title: sec.title, body: sec.body, ...(label?.trim() ? { label: label.trim().slice(0, 120) } : {}) };
  let next = [...list, v];
  while (next.length > MAX_VERSIONS) {
    const drop = next.findIndex((x) => x.kind !== "snapshot");
    next = next.filter((_, i) => i !== (drop === -1 ? 0 : drop));
  }
  return { ...sec, versions: next };
}

/** An autosaved revision when the text has changed and the last version is old enough. */
export function maybeAutosave(sec: Section, now = new Date()): Section {
  const last = sec.versions?.[sec.versions.length - 1];
  if (!sec.body.trim()) return sec;
  if (last && now.getTime() - new Date(last.at).getTime() < AUTOSAVE_EVERY_MS) return sec;
  return addVersion(sec, "autosave", undefined, now);
}

/** Puts a version back; the text it replaces is kept first as "Before restoring". */
export function restoreVersion(m: Manuscript, sectionId: string, versionId: string): Manuscript {
  return {
    ...m,
    sections: m.sections.map((s) => {
      if (s.id !== sectionId) return s;
      const v = s.versions?.find((x) => x.id === versionId);
      if (!v) return s;
      const kept = addVersion(s, "before-restore");
      return { ...kept, title: v.title || s.title, body: v.body };
    }),
  };
}

export const removeVersion = (sec: Section, versionId: string): Section => ({ ...sec, versions: (sec.versions ?? []).filter((v) => v.id !== versionId) });

/** Newest first, for display. */
export const versionsNewestFirst = (sec: Section) => [...(sec.versions ?? [])].reverse();
