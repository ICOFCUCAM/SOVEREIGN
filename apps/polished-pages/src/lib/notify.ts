// Telling the owner a long job has finished while they are away from the tab (DESIGN-SPEC.md §21):
// a browser notification (when they allowed it) and a marked tab title until they come back.

/** Asks once, on a click that starts a long job, whether the Studio may notify when it ends. */
export function askToNotify(): void {
  try { if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission(); } catch { /* not supported */ }
}

let original: string | null = null;
function markTitle(mark: string) {
  if (typeof document === "undefined") return;
  original ??= document.title;
  document.title = `${mark} ${original}`;
  const back = () => { if (!document.hidden && original !== null) { document.title = original; original = null; document.removeEventListener("visibilitychange", back); } };
  document.addEventListener("visibilitychange", back);
}

/** Announces a finished (or failed) job, only when the owner isn't looking at the Studio. */
export function announce(ok: boolean, title: string, body = ""): boolean {
  if (typeof document === "undefined" || !document.hidden) return false;
  markTitle(ok ? "✓" : "⚠");
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const n = new Notification(`${ok ? "Done" : "Claude couldn't finish"}: ${title}`, { body: body.slice(0, 200), tag: "claude-studio" });
      n.onclick = () => { window.focus(); n.close(); };
    }
  } catch { /* not supported */ }
  return true;
}
