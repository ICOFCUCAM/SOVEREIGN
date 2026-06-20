// Languages offered for native creation and translation. `iso` feeds the EPUB
// dc:language; `rtl` flags right-to-left scripts. Any language the model
// supports can also be typed free-form.
export interface Language { name: string; iso: string; rtl?: boolean }

export const LANGUAGES: Language[] = [
  { name: "English", iso: "en" },
  { name: "French", iso: "fr" },
  { name: "Spanish", iso: "es" },
  { name: "Portuguese", iso: "pt" },
  { name: "German", iso: "de" },
  { name: "Italian", iso: "it" },
  { name: "Dutch", iso: "nl" },
  { name: "Norwegian", iso: "no" },
  { name: "Swedish", iso: "sv" },
  { name: "Danish", iso: "da" },
  { name: "Finnish", iso: "fi" },
  { name: "Arabic", iso: "ar", rtl: true },
  { name: "Hebrew", iso: "he", rtl: true },
  { name: "Persian", iso: "fa", rtl: true },
  { name: "Urdu", iso: "ur", rtl: true },
  { name: "Swahili", iso: "sw" },
  { name: "Lingala", iso: "ln" },
  { name: "Hausa", iso: "ha" },
  { name: "Fulfulde", iso: "ff" },
  { name: "Zulu", iso: "zu" },
  { name: "Chinese", iso: "zh" },
  { name: "Japanese", iso: "ja" },
  { name: "Korean", iso: "ko" },
  { name: "Hindi", iso: "hi" },
  { name: "Bengali", iso: "bn" },
  { name: "Tamil", iso: "ta" },
];

export const LANGUAGE_NAMES = LANGUAGES.map((l) => l.name);
export const isoFor = (name?: string): string => LANGUAGES.find((l) => l.name.toLowerCase() === (name ?? "").toLowerCase())?.iso ?? "en";
export const isRtlLanguage = (name?: string): boolean => !!LANGUAGES.find((l) => l.name.toLowerCase() === (name ?? "").toLowerCase())?.rtl;

// Detect right-to-left content from the text itself (Hebrew/Arabic script
// ranges) so renderers and exports apply direction automatically.
export function isRtlText(s: string): boolean {
  const rtl = (s.match(/[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const ltr = (s.match(/[A-Za-z]/g) || []).length;
  return rtl > 0 && rtl >= ltr;
}
