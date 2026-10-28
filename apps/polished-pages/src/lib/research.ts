// Research this section (DESIGN-SPEC.md §21): the owner asks about a passage, a word or a topic and
// Claude finds scripture, related topics and scholars, checked on the web, never invented. "My sources"
// is searched in the browser, in the uploaded documents and the manuscript.

export type ResearchScope = "all" | "scripture" | "topics" | "scholars";
export interface ResearchResult {
  scripture: { ref: string; note: string; translation?: string }[];
  topics: { title: string; line: string }[];
  scholars: { name: string; work: string; line: string; url?: string }[];
}

export function researchPrompt(query: string, scope: ResearchScope, where: string): string {
  const want = scope === "all" ? "scripture, topics and scholars" : scope;
  return `Research "${query}" for the section of the book in ${where}. Find ${want}.
- scripture: passages that bear on it, as references (e.g. "Genesis 16:7-13") with one line on what each says, and the translation you checked ("KJV" when you read it there). Check every reference exists and says that; never invent one.
- topics: related topics a reader of this section would want to follow, each with one line.
- scholars: published works by scholars that discuss it, only ones you found and opened on the web (WebSearch, WebFetch), with the URL you opened; none rather than an unverified one.
Do not rewrite or judge the section. Up to 12 scripture passages, 8 topics and 8 scholars.
Reply with valid JSON only, exactly this shape: {"scripture":[{"ref":"","note":"","translation":""}],"topics":[{"title":"","line":""}],"scholars":[{"name":"","work":"","line":"","url":""}]}`;
}

export function parseResearch(raw: string): ResearchResult {
  let v: Partial<ResearchResult>;
  try { v = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```\s*$/g, "").trim()); } catch { throw new Error("Claude's research wasn't valid. Try again."); }
  const arr = <T,>(x: unknown, ok: (y: T) => boolean): T[] => (Array.isArray(x) ? (x as T[]).filter((y) => y && typeof y === "object" && ok(y)) : []);
  return {
    scripture: arr<ResearchResult["scripture"][number]>(v.scripture, (y) => typeof y.ref === "string" && Boolean(y.ref.trim())),
    topics: arr<ResearchResult["topics"][number]>(v.topics, (y) => typeof y.title === "string" && Boolean(y.title.trim())),
    scholars: arr<ResearchResult["scholars"][number]>(v.scholars, (y) => typeof y.name === "string" && Boolean(y.name.trim())).map((s) => ({ ...s, url: s.url && /^https?:\/\//.test(s.url) ? s.url : undefined })),
  };
}

/** My sources: where the words appear in the uploaded documents and the manuscript, with a little context. */
export function searchSources(docs: { name: string; text: string }[], query: string, max = 20): { name: string; excerpt: string }[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const out: { name: string; excerpt: string }[] = [];
  for (const d of docs) {
    const low = d.text.toLowerCase();
    let i = low.indexOf(q);
    while (i >= 0 && out.length < max) {
      out.push({ name: d.name, excerpt: `…${d.text.slice(Math.max(0, i - 70), i + q.length + 90).replace(/\s+/g, " ").trim()}…` });
      i = low.indexOf(q, i + q.length + 200);
    }
  }
  return out;
}
