// Languages offered for native creation and translation. `iso` feeds the EPUB
// dc:language; any language the model supports can also be typed free-form.
export interface Language { name: string; iso: string }

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
  { name: "Arabic", iso: "ar" },
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
