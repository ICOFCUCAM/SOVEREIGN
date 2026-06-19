import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/lib/fonts";

createRoot(document.getElementById("root")!).render(<App />);
