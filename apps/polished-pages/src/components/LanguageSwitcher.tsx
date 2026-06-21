import { Languages, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useI18n, LOCALES } from "@/lib/i18n";

// Locale picker for the marketing chrome. Compact globe trigger; lists the
// available languages with the active one checked.
const LanguageSwitcher = ({ className = "" }: { className?: string }) => {
  const { locale, setLocale } = useI18n();
  const current = LOCALES.find((l) => l.code === locale);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-premium hover:bg-muted hover:text-foreground font-sans ${className}`} aria-label="Change language">
          <Languages className="h-4 w-4" />
          <span className="hidden lg:inline">{current?.label ?? "English"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => setLocale(l.code)} className="flex items-center justify-between">
            {l.label}
            {l.code === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
