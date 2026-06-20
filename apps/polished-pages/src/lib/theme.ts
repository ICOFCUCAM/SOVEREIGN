// Theme management: light / dark / system, persisted to localStorage and
// applied as a class on <html>. An inline script in index.html applies the
// stored choice before first paint to avoid a flash of the wrong theme; this
// module keeps it in sync at runtime and reacts to OS changes in system mode.
export type Theme = "light" | "dark" | "system";

const KEY = "pp_theme";

export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(t: Theme): "light" | "dark" {
  return t === "system" ? (systemPrefersDark() ? "dark" : "light") : t;
}

export function applyTheme(t: Theme): void {
  const resolved = resolveTheme(t);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  // Keep the mobile browser chrome colour in sync.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#0a0f1d" : "#ffffff");
}

export function setTheme(t: Theme): void {
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  applyTheme(t);
}

// Re-apply on OS theme change while in system mode.
export function watchSystemTheme(): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => { if (getStoredTheme() === "system") applyTheme("system"); };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
