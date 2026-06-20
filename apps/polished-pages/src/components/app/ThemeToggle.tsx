import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";

// Compact theme switch that cycles Light → Dark → System. Shows the icon for
// the current choice; the title announces the next state for clarity.
const ORDER: Theme[] = ["light", "dark", "system"];
const ICON = { light: Sun, dark: Moon, system: Monitor } as const;
const LABEL = { light: "Light", dark: "Dark", system: "System" } as const;

const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const [theme, setThemeState] = useState<Theme>("system");
  useEffect(() => { setThemeState(getStoredTheme()); }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    setThemeState(next);
  };

  const Icon = ICON[theme];
  const nextLabel = LABEL[ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]];

  return (
    <button
      type="button"
      onClick={cycle}
      className={`rounded-md p-1.5 text-muted-foreground transition-premium hover:bg-muted hover:text-foreground ${className}`}
      title={`Theme: ${LABEL[theme]} — switch to ${nextLabel}`}
      aria-label={`Theme: ${LABEL[theme]}. Switch to ${nextLabel}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
};

export default ThemeToggle;
