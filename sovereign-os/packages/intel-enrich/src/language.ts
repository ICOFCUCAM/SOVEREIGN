import type { DetectedLanguage } from './types.js';

// Lightweight language detector. Unicode-block heuristic for non-Latin
// scripts; English-vs-other stopword check inside Latin. Honest for a
// reference; production deployments swap in a model (fasttext-ld, cld3,
// or a hosted classifier).

const STOPWORDS: Record<string, readonly string[]> = {
  en: ['the','of','and','to','a','in','that','is','for','it','with','as','on','at','by','this','from'],
  es: ['el','la','de','que','y','en','los','un','una','para','con','del','las','por','se','su'],
  pt: ['o','a','de','que','e','do','da','em','um','para','com','não','uma','os','no','se','na'],
  fr: ['le','la','de','et','les','des','en','un','une','que','pour','dans','est','au','aux','qui','par'],
  de: ['der','die','und','in','den','von','zu','das','mit','sich','des','auf','für','ist','im','dem','nicht'],
  it: ['il','la','di','che','e','la','un','in','per','è','non','con','si','le','i','del','sono'],
  nl: ['de','het','een','van','en','in','op','is','dat','niet','voor','met','zijn','ze','aan','door'],
};

function scriptOf(text: string): 'latin' | 'cyrillic' | 'arabic' | 'devanagari' | 'cjk' | 'mixed' | 'unknown' {
  let latin = 0, cyrillic = 0, arabic = 0, devanagari = 0, cjk = 0, total = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code === undefined || code <= 32) continue;
    total++;
    if (code <= 0x024F) latin++;
    else if (code >= 0x0400 && code <= 0x04FF) cyrillic++;
    else if ((code >= 0x0600 && code <= 0x06FF) || (code >= 0x0750 && code <= 0x077F)) arabic++;
    else if (code >= 0x0900 && code <= 0x097F) devanagari++;
    else if (
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3040 && code <= 0x309F) ||
      (code >= 0x30A0 && code <= 0x30FF) ||
      (code >= 0xAC00 && code <= 0xD7A3)
    ) cjk++;
  }
  if (total === 0) return 'unknown';
  const max = Math.max(latin, cyrillic, arabic, devanagari, cjk);
  if (max / total < 0.5) return 'mixed';
  if (max === latin) return 'latin';
  if (max === cyrillic) return 'cyrillic';
  if (max === arabic) return 'arabic';
  if (max === devanagari) return 'devanagari';
  return 'cjk';
}

function scoreLatinLanguage(text: string): DetectedLanguage {
  const tokens = text.toLowerCase().match(/[a-zà-ÿ]+/gi) ?? [];
  if (tokens.length === 0) return { language: 'en', confidence: 0.1 };
  const counts: Record<string, number> = {};
  for (const [lang, stop] of Object.entries(STOPWORDS)) {
    const set = new Set(stop);
    let hits = 0;
    for (const t of tokens) if (set.has(t)) hits++;
    counts[lang] = hits;
  }
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  const [topLang = 'en', topHits = 0] = sorted[0] ?? [];
  const [, secondHits = 0] = sorted[1] ?? [];
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) return { language: 'en', confidence: 0.3 };
  const margin = (topHits - secondHits) / Math.max(1, total);
  const confidence = Math.min(0.95, 0.4 + margin * 0.6);
  return { language: topLang, confidence };
}

export function detectLanguage(text: string): DetectedLanguage {
  if (!text || text.length < 8) return { language: 'en', confidence: 0.1 };
  const script = scriptOf(text);
  switch (script) {
    case 'cyrillic':   return { language: 'ru', confidence: 0.85 };
    case 'arabic':     return { language: 'ar', confidence: 0.85 };
    case 'devanagari': return { language: 'hi', confidence: 0.85 };
    case 'cjk': {
      // Heuristic split: any hiragana/katakana → ja; any hangul → ko; else zh.
      if (/[぀-ゟ゠-ヿ]/.test(text)) return { language: 'ja', confidence: 0.85 };
      if (/[가-힣]/.test(text)) return { language: 'ko', confidence: 0.85 };
      return { language: 'zh', confidence: 0.8 };
    }
    case 'latin':      return scoreLatinLanguage(text);
    case 'mixed':
    case 'unknown':
    default:           return { language: 'und', confidence: 0.2 };
  }
}
