// Lexical retrieval. BM25-style scoring with corpus-aware IDF. Honest
// for a reference: no embeddings, no model — pure token statistics.
// Production substrates upgrade to vector retrieval; the contract is
// agnostic to which.

const STOPWORDS = new Set([
  'a','an','and','are','as','at','be','by','for','from','has','have','in',
  'is','it','its','of','on','or','that','the','this','to','was','were',
  'will','with','we','our','their','they','these','those',
]);

const TOKEN_RE = /[A-Za-z][A-Za-z0-9-]{1,}/g;

export function tokenize(text: string): readonly string[] {
  const out: string[] = [];
  const matches = text.toLowerCase().match(TOKEN_RE);
  if (!matches) return out;
  for (const m of matches) {
    if (m.length >= 2 && !STOPWORDS.has(m)) out.push(m);
  }
  return out;
}

interface Doc {
  readonly id: string;
  readonly tokens: readonly string[];
}

export interface ScoredDoc {
  readonly id: string;
  readonly score: number;
}

const K1 = 1.5;
const B = 0.75;

export function score(query: string, corpus: readonly Doc[]): readonly ScoredDoc[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || corpus.length === 0) return [];

  const N = corpus.length;
  const docFreq = new Map<string, number>();
  for (const d of corpus) {
    const seen = new Set<string>();
    for (const t of d.tokens) {
      if (!seen.has(t)) { seen.add(t); docFreq.set(t, (docFreq.get(t) ?? 0) + 1); }
    }
  }

  const totalLen = corpus.reduce((s, d) => s + d.tokens.length, 0);
  const avgLen = totalLen / N;

  const results: ScoredDoc[] = [];
  for (const d of corpus) {
    const tf = new Map<string, number>();
    for (const t of d.tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    const docLen = d.tokens.length || 1;
    let s = 0;
    for (const q of queryTokens) {
      const f = tf.get(q) ?? 0;
      if (f === 0) continue;
      const n = docFreq.get(q) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const numer = f * (K1 + 1);
      const denom = f + K1 * (1 - B + B * (docLen / avgLen));
      s += idf * (numer / denom);
    }
    if (s > 0) results.push({ id: d.id, score: s });
  }
  return results.sort((a, b) => b.score - a.score);
}

export function makeDoc(id: string, text: string): Doc {
  return { id, tokens: tokenize(text) };
}
