import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/lib/fonts";
import { getStoredTheme, applyTheme, watchSystemTheme } from "@/lib/theme";

// Sync theme on load (the inline script already applied it pre-paint) and keep
// it reactive to OS changes while in system mode.
applyTheme(getStoredTheme());
watchSystemTheme();

createRoot(document.getElementById("root")!).render(<App />);

// Warm the cache for the highest-intent next destinations once the browser is
// idle, so the first navigation from the landing page feels instant. This runs
// after first paint and never blocks initial load.
const prefetch = () => {
  import("./pages/Dashboard.tsx").catch(() => {});
  import("./pages/CatalogPage.tsx").catch(() => {});
};
if ("requestIdleCallback" in window) {
  (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prefetch);
} else {
  setTimeout(prefetch, 2000);
}
