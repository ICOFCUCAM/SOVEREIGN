// Font files for print typesetting (interior PDFs) and for non-Latin covers.
// All are SIL OFL, from Google Fonts via @expo-google-fonts, served as
// on-demand static assets: a file is only downloaded when a book uses it.
// The Chinese, Japanese and Korean faces are ~15 MB each, too large to ship
// with the site, so they are fetched from the jsDelivr npm CDN (pinned
// versions) the first time a book needs them.
import type { ScriptId } from "@/lib/typeset/scripts";
import ebgaramondR from "@expo-google-fonts/eb-garamond/400Regular/EBGaramond_400Regular.ttf?url";
import ebgaramondI from "@expo-google-fonts/eb-garamond/400Regular_Italic/EBGaramond_400Regular_Italic.ttf?url";
import ebgaramondB from "@expo-google-fonts/eb-garamond/700Bold/EBGaramond_700Bold.ttf?url";
import ebgaramondBI from "@expo-google-fonts/eb-garamond/700Bold_Italic/EBGaramond_700Bold_Italic.ttf?url";
import cormorantR from "@expo-google-fonts/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf?url";
import cormorantI from "@expo-google-fonts/cormorant-garamond/400Regular_Italic/CormorantGaramond_400Regular_Italic.ttf?url";
import cormorantB from "@expo-google-fonts/cormorant-garamond/700Bold/CormorantGaramond_700Bold.ttf?url";
import cormorantBI from "@expo-google-fonts/cormorant-garamond/700Bold_Italic/CormorantGaramond_700Bold_Italic.ttf?url";
import baskervilleR from "@expo-google-fonts/libre-baskerville/400Regular/LibreBaskerville_400Regular.ttf?url";
import baskervilleI from "@expo-google-fonts/libre-baskerville/400Regular_Italic/LibreBaskerville_400Regular_Italic.ttf?url";
import baskervilleB from "@expo-google-fonts/libre-baskerville/700Bold/LibreBaskerville_700Bold.ttf?url";
import baskervilleBI from "@expo-google-fonts/libre-baskerville/700Bold_Italic/LibreBaskerville_700Bold_Italic.ttf?url";
import crimsonR from "@expo-google-fonts/crimson-pro/400Regular/CrimsonPro_400Regular.ttf?url";
import crimsonI from "@expo-google-fonts/crimson-pro/400Regular_Italic/CrimsonPro_400Regular_Italic.ttf?url";
import crimsonB from "@expo-google-fonts/crimson-pro/700Bold/CrimsonPro_700Bold.ttf?url";
import crimsonBI from "@expo-google-fonts/crimson-pro/700Bold_Italic/CrimsonPro_700Bold_Italic.ttf?url";
import loraR from "@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf?url";
import loraI from "@expo-google-fonts/lora/400Regular_Italic/Lora_400Regular_Italic.ttf?url";
import loraB from "@expo-google-fonts/lora/700Bold/Lora_700Bold.ttf?url";
import loraBI from "@expo-google-fonts/lora/700Bold_Italic/Lora_700Bold_Italic.ttf?url";
import notoserifR from "@expo-google-fonts/noto-serif/400Regular/NotoSerif_400Regular.ttf?url";
import notoserifI from "@expo-google-fonts/noto-serif/400Regular_Italic/NotoSerif_400Regular_Italic.ttf?url";
import notoserifB from "@expo-google-fonts/noto-serif/700Bold/NotoSerif_700Bold.ttf?url";
import notoserifBI from "@expo-google-fonts/noto-serif/700Bold_Italic/NotoSerif_700Bold_Italic.ttf?url";
import playfairR from "@expo-google-fonts/playfair-display/400Regular/PlayfairDisplay_400Regular.ttf?url";
import playfairI from "@expo-google-fonts/playfair-display/400Regular_Italic/PlayfairDisplay_400Regular_Italic.ttf?url";
import playfairB from "@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf?url";
import playfairBI from "@expo-google-fonts/playfair-display/700Bold_Italic/PlayfairDisplay_700Bold_Italic.ttf?url";
import montserratR from "@expo-google-fonts/montserrat/400Regular/Montserrat_400Regular.ttf?url";
import montserratI from "@expo-google-fonts/montserrat/400Regular_Italic/Montserrat_400Regular_Italic.ttf?url";
import montserratB from "@expo-google-fonts/montserrat/700Bold/Montserrat_700Bold.ttf?url";
import montserratBI from "@expo-google-fonts/montserrat/700Bold_Italic/Montserrat_700Bold_Italic.ttf?url";
import arabicR from "@expo-google-fonts/noto-naskh-arabic/400Regular/NotoNaskhArabic_400Regular.ttf?url";
import arabicB from "@expo-google-fonts/noto-naskh-arabic/700Bold/NotoNaskhArabic_700Bold.ttf?url";
import hebrewR from "@expo-google-fonts/noto-serif-hebrew/400Regular/NotoSerifHebrew_400Regular.ttf?url";
import hebrewB from "@expo-google-fonts/noto-serif-hebrew/700Bold/NotoSerifHebrew_700Bold.ttf?url";
import ethiopicR from "@expo-google-fonts/noto-serif-ethiopic/400Regular/NotoSerifEthiopic_400Regular.ttf?url";
import ethiopicB from "@expo-google-fonts/noto-serif-ethiopic/700Bold/NotoSerifEthiopic_700Bold.ttf?url";
import devanagariR from "@expo-google-fonts/noto-serif-devanagari/400Regular/NotoSerifDevanagari_400Regular.ttf?url";
import devanagariB from "@expo-google-fonts/noto-serif-devanagari/700Bold/NotoSerifDevanagari_700Bold.ttf?url";
import bengaliR from "@expo-google-fonts/noto-serif-bengali/400Regular/NotoSerifBengali_400Regular.ttf?url";
import bengaliB from "@expo-google-fonts/noto-serif-bengali/700Bold/NotoSerifBengali_700Bold.ttf?url";
import tamilR from "@expo-google-fonts/noto-serif-tamil/400Regular/NotoSerifTamil_400Regular.ttf?url";
import tamilB from "@expo-google-fonts/noto-serif-tamil/700Bold/NotoSerifTamil_700Bold.ttf?url";
import armenianR from "@expo-google-fonts/noto-serif-armenian/400Regular/NotoSerifArmenian_400Regular.ttf?url";
import armenianB from "@expo-google-fonts/noto-serif-armenian/700Bold/NotoSerifArmenian_700Bold.ttf?url";
import georgianR from "@expo-google-fonts/noto-serif-georgian/400Regular/NotoSerifGeorgian_400Regular.ttf?url";
import georgianB from "@expo-google-fonts/noto-serif-georgian/700Bold/NotoSerifGeorgian_700Bold.ttf?url";

export type Style = "regular" | "italic" | "bold" | "boldItalic";
export interface BookFace { label: string; files: Record<Style, string> }

/** Typefaces offered for the inside of the book. Keys match Cover Studio's, so a cover and its interior can share a face. */
export const BOOK_FACES = {
  ebgaramond: { label: "EB Garamond", files: { regular: ebgaramondR, italic: ebgaramondI, bold: ebgaramondB, boldItalic: ebgaramondBI } },
  cormorant: { label: "Cormorant Garamond", files: { regular: cormorantR, italic: cormorantI, bold: cormorantB, boldItalic: cormorantBI } },
  baskerville: { label: "Libre Baskerville", files: { regular: baskervilleR, italic: baskervilleI, bold: baskervilleB, boldItalic: baskervilleBI } },
  crimson: { label: "Crimson Pro", files: { regular: crimsonR, italic: crimsonI, bold: crimsonB, boldItalic: crimsonBI } },
  lora: { label: "Lora", files: { regular: loraR, italic: loraI, bold: loraB, boldItalic: loraBI } },
  notoserif: { label: "Noto Serif", files: { regular: notoserifR, italic: notoserifI, bold: notoserifB, boldItalic: notoserifBI } },
  playfair: { label: "Playfair Display", files: { regular: playfairR, italic: playfairI, bold: playfairB, boldItalic: playfairBI } },
  montserrat: { label: "Montserrat", files: { regular: montserratR, italic: montserratI, bold: montserratB, boldItalic: montserratBI } },
} satisfies Record<string, BookFace>;
export type BookFaceId = keyof typeof BOOK_FACES;
/** Body faces (everything) and heading faces (everything plus display faces). */
export const BODY_FACES: BookFaceId[] = ["ebgaramond", "baskerville", "crimson", "lora", "cormorant", "notoserif"];
export const HEADING_FACES: BookFaceId[] = [...BODY_FACES, "playfair", "montserrat"];

export interface ScriptFace { label: string; family: string; files: { regular: string; bold: string }; remote?: boolean }
/** One face per writing system, used wherever the book face has no letters for it. */
export const SCRIPT_FACES: Record<ScriptId, ScriptFace> = {
  arabic: { label: "Noto Naskh Arabic", family: "Noto Naskh Arabic", files: { regular: arabicR, bold: arabicB } },
  hebrew: { label: "Noto Serif Hebrew", family: "Noto Serif Hebrew", files: { regular: hebrewR, bold: hebrewB } },
  ethiopic: { label: "Noto Serif Ethiopic", family: "Noto Serif Ethiopic", files: { regular: ethiopicR, bold: ethiopicB } },
  devanagari: { label: "Noto Serif Devanagari", family: "Noto Serif Devanagari", files: { regular: devanagariR, bold: devanagariB } },
  bengali: { label: "Noto Serif Bengali", family: "Noto Serif Bengali", files: { regular: bengaliR, bold: bengaliB } },
  tamil: { label: "Noto Serif Tamil", family: "Noto Serif Tamil", files: { regular: tamilR, bold: tamilB } },
  armenian: { label: "Noto Serif Armenian", family: "Noto Serif Armenian", files: { regular: armenianR, bold: armenianB } },
  georgian: { label: "Noto Serif Georgian", family: "Noto Serif Georgian", files: { regular: georgianR, bold: georgianB } },
  sc: { label: "Noto Serif SC", family: "Noto Serif SC", files: { regular: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-serif-sc@0.4.4/400Regular/NotoSerifSC_400Regular.ttf", bold: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-serif-sc@0.4.4/700Bold/NotoSerifSC_700Bold.ttf" }, remote: true },
  tc: { label: "Noto Serif TC", family: "Noto Serif TC", files: { regular: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-serif-tc@0.4.5/400Regular/NotoSerifTC_400Regular.ttf", bold: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-serif-tc@0.4.5/700Bold/NotoSerifTC_700Bold.ttf" }, remote: true },
  jp: { label: "Noto Serif JP", family: "Noto Serif JP", files: { regular: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-serif-jp@0.4.4/400Regular/NotoSerifJP_400Regular.ttf", bold: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-serif-jp@0.4.4/700Bold/NotoSerifJP_700Bold.ttf" }, remote: true },
  kr: { label: "Noto Serif KR", family: "Noto Serif KR", files: { regular: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-serif-kr@0.4.4/400Regular/NotoSerifKR_400Regular.ttf", bold: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-serif-kr@0.4.4/700Bold/NotoSerifKR_700Bold.ttf" }, remote: true },
};
/** Latin, Greek and Cyrillic fallback when a chosen face lacks a letter. */
export const FALLBACK_FACE: BookFaceId = "notoserif";
