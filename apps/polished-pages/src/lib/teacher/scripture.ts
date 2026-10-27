// Scripture references in a passage (AI Teacher blueprint §2a: "scripture_refs,
// normalised, original form kept"). The normalised form uses a fixed book code
// so "Gen. 1:1", "Genesis 1:1" and "Gn 1:1" all retrieve together; the
// original text is kept exactly as the author wrote it.

export interface ScriptureRef { book: string; chapter: number; verse?: number; verseEnd?: number; normalized: string; original: string }

// Canonical code → the names and abbreviations an author may write.
const BOOKS: [string, string[]][] = [
  ["GEN", ["Genesis", "Gen", "Gn"]], ["EXO", ["Exodus", "Exod", "Ex"]], ["LEV", ["Leviticus", "Lev", "Lv"]], ["NUM", ["Numbers", "Num", "Nm"]], ["DEU", ["Deuteronomy", "Deut", "Dt"]],
  ["JOS", ["Joshua", "Josh"]], ["JDG", ["Judges", "Judg", "Jdg"]], ["RUT", ["Ruth"]], ["1SA", ["1 Samuel", "1 Sam", "I Samuel"]], ["2SA", ["2 Samuel", "2 Sam", "II Samuel"]],
  ["1KI", ["1 Kings", "1 Kgs", "I Kings"]], ["2KI", ["2 Kings", "2 Kgs", "II Kings"]], ["1CH", ["1 Chronicles", "1 Chr"]], ["2CH", ["2 Chronicles", "2 Chr"]], ["EZR", ["Ezra"]], ["NEH", ["Nehemiah", "Neh"]],
  ["EST", ["Esther", "Esth"]], ["JOB", ["Job"]], ["PSA", ["Psalms", "Psalm", "Ps", "Pss"]], ["PRO", ["Proverbs", "Prov", "Prv"]], ["ECC", ["Ecclesiastes", "Eccl", "Qoheleth"]], ["SNG", ["Song of Songs", "Song of Solomon", "Song"]],
  ["ISA", ["Isaiah", "Isa"]], ["JER", ["Jeremiah", "Jer"]], ["LAM", ["Lamentations", "Lam"]], ["EZK", ["Ezekiel", "Ezek"]], ["DAN", ["Daniel", "Dan"]], ["HOS", ["Hosea", "Hos"]], ["JOL", ["Joel"]], ["AMO", ["Amos"]],
  ["OBA", ["Obadiah", "Obad"]], ["JON", ["Jonah"]], ["MIC", ["Micah", "Mic"]], ["NAM", ["Nahum", "Nah"]], ["HAB", ["Habakkuk", "Hab"]], ["ZEP", ["Zephaniah", "Zeph"]], ["HAG", ["Haggai", "Hag"]], ["ZEC", ["Zechariah", "Zech"]], ["MAL", ["Malachi", "Mal"]],
  ["MAT", ["Matthew", "Matt", "Mt"]], ["MRK", ["Mark", "Mk"]], ["LUK", ["Luke", "Lk"]], ["JHN", ["John", "Jn"]], ["ACT", ["Acts"]], ["ROM", ["Romans", "Rom"]], ["1CO", ["1 Corinthians", "1 Cor"]], ["2CO", ["2 Corinthians", "2 Cor"]],
  ["GAL", ["Galatians", "Gal"]], ["EPH", ["Ephesians", "Eph"]], ["PHP", ["Philippians", "Phil"]], ["COL", ["Colossians", "Col"]], ["1TH", ["1 Thessalonians", "1 Thess"]], ["2TH", ["2 Thessalonians", "2 Thess"]],
  ["1TI", ["1 Timothy", "1 Tim"]], ["2TI", ["2 Timothy", "2 Tim"]], ["TIT", ["Titus"]], ["PHM", ["Philemon", "Phlm"]], ["HEB", ["Hebrews", "Heb"]], ["JAS", ["James", "Jas"]], ["1PE", ["1 Peter", "1 Pet"]], ["2PE", ["2 Peter", "2 Pet"]],
  ["1JN", ["1 John", "1 Jn"]], ["2JN", ["2 John", "2 Jn"]], ["3JN", ["3 John", "3 Jn"]], ["JUD", ["Jude"]], ["REV", ["Revelation", "Rev"]],
  // Deuterocanonical and Second Temple works a study of spirits often cites
  ["TOB", ["Tobit", "Tob"]], ["1EN", ["1 Enoch", "1 En"]], ["JUB", ["Jubilees", "Jub"]], ["WIS", ["Wisdom of Solomon", "Wisdom", "Wis"]], ["SIR", ["Sirach", "Ecclesiasticus", "Sir"]],
];

const NAME_TO_CODE = new Map<string, string>();
for (const [code, names] of BOOKS) for (const n of names) NAME_TO_CODE.set(n.toLowerCase().replace(/\s+/g, " "), code);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
// Longest names first, so "1 John" wins over "John" and "Song of Songs" over "Song".
const NAMES = [...NAME_TO_CODE.keys()].sort((a, b) => b.length - a.length).map(escape).join("|");
const REF = new RegExp(`(?<![\\p{L}\\d])(${NAMES})\\.?\\s+(\\d{1,3})(?::(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?)?(?![\\d:])`, "giu");

/** Every reference in the text, in order, normalised ("GEN 6:1-4") with the original wording kept. */
export function scriptureRefs(text: string): ScriptureRef[] {
  const out: ScriptureRef[] = [];
  for (const x of text.matchAll(REF)) {
    const book = NAME_TO_CODE.get(x[1].toLowerCase().replace(/\s+/g, " "));
    if (!book) continue;
    const chapter = Number(x[2]), verse = x[3] ? Number(x[3]) : undefined, verseEnd = x[4] ? Number(x[4]) : undefined;
    // A bare "Mark 3" or "Job 2" is only a reference when the name is capitalised as a book.
    if (verse === undefined && x[1][0] !== x[1][0].toUpperCase()) continue;
    out.push({ book, chapter, verse, verseEnd, normalized: `${book} ${chapter}${verse ? `:${verse}` : ""}${verseEnd ? `-${verseEnd}` : ""}`, original: x[0] });
  }
  return out;
}
