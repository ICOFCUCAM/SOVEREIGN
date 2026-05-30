export interface Chunk {
  readonly anchor: string;
  readonly text: string;
}

const MAX_CHUNK_CHARS = 1200;

// Paragraph-first chunking with a hard char cap. Paragraphs longer than
// MAX_CHUNK_CHARS are split on sentence boundaries; sentences longer
// than MAX_CHUNK_CHARS are sliced by character.
export function chunkDocument(body: string): readonly Chunk[] {
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let idx = 0;

  for (const para of paras) {
    if (para.length <= MAX_CHUNK_CHARS) {
      chunks.push({ anchor: `c${idx++}`, text: para });
      continue;
    }
    const sentences = para.split(/(?<=[.!?])\s+/);
    let buf = '';
    for (const s of sentences) {
      if (buf.length + s.length + 1 > MAX_CHUNK_CHARS) {
        if (buf) {
          chunks.push({ anchor: `c${idx++}`, text: buf });
          buf = '';
        }
        if (s.length > MAX_CHUNK_CHARS) {
          for (let i = 0; i < s.length; i += MAX_CHUNK_CHARS) {
            chunks.push({ anchor: `c${idx++}`, text: s.slice(i, i + MAX_CHUNK_CHARS) });
          }
        } else {
          buf = s;
        }
      } else {
        buf = buf ? `${buf} ${s}` : s;
      }
    }
    if (buf) chunks.push({ anchor: `c${idx++}`, text: buf });
  }

  return chunks;
}
