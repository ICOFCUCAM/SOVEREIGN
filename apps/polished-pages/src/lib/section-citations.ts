// The citations a section already carries (DESIGN-SPEC.md §21), found in its text without changing it:
// scripture references, author–year references, and quotations.

const BOOKS = "Genesis|Gen|Exodus|Exod|Ex|Leviticus|Lev|Numbers|Num|Deuteronomy|Deut|Joshua|Josh|Judges|Judg|Ruth|1 Samuel|2 Samuel|1 Sam|2 Sam|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Neh|Esther|Job|Psalms?|Ps|Proverbs|Prov|Ecclesiastes|Eccl|Song of Solomon|Isaiah|Isa|Jeremiah|Jer|Lamentations|Lam|Ezekiel|Ezek|Daniel|Dan|Hosea|Hos|Joel|Amos|Obadiah|Jonah|Micah|Mic|Nahum|Habakkuk|Hab|Zephaniah|Haggai|Zechariah|Zech|Malachi|Mal|Matthew|Matt|Mark|Luke|John|Acts|Romans|Rom|1 Corinthians|2 Corinthians|1 Cor|2 Cor|Galatians|Gal|Ephesians|Eph|Philippians|Phil|Colossians|Col|1 Thessalonians|2 Thessalonians|1 Thess|2 Thess|1 Timothy|2 Timothy|1 Tim|2 Tim|Titus|Philemon|Hebrews|Heb|James|Jas|1 Peter|2 Peter|1 Pet|2 Pet|1 John|2 John|3 John|Jude|Revelation|Rev";
const SCRIPTURE = new RegExp(`\\b(?:${BOOKS})\\.?\\s+\\d{1,3}:\\d{1,3}(?:[-–]\\d{1,3})?(?:,\\s*\\d{1,3}(?:[-–]\\d{1,3})?)*`, "g");
const AUTHOR_YEAR = /\(([A-Z][\p{L}'’-]+(?:(?:,| and| &| et al\.?)\s*[A-Z]?[\p{L}'’-]*)*),?\s+(1[5-9]\d\d|20\d\d)(?:,\s*(?:pp?\.\s*)?[\d–-]+)?\)/gu;

export interface FoundCitations { scripture: string[]; works: string[]; quotations: number }
export function findCitations(text: string): FoundCitations {
  const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.replace(/\s+/g, " ").trim()))];
  return {
    scripture: uniq(text.match(SCRIPTURE) ?? []),
    works: uniq([...text.matchAll(AUTHOR_YEAR)].map((m) => m[0].slice(1, -1))),
    quotations: (text.match(/“[^”]{12,}”|"[^"]{12,}"/g) ?? []).length + text.split("\n").filter((l) => /^\s*>/.test(l)).length,
  };
}
