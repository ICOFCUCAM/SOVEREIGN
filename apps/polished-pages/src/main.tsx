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
