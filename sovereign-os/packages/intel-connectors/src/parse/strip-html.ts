// Strip HTML tags and collapse whitespace. Sufficient for body_excerpt
// extraction from RSS descriptions — not a security boundary.

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&apos;': "'", '&nbsp;': ' ',
};

export function stripHtml(input: string, maxChars = 4096): string {
  if (!input) return '';
  let s = input.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  s = s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  for (const [k, v] of Object.entries(ENTITIES)) s = s.split(k).join(v);
  s = s.replace(/\s+/g, ' ').trim();
  return s.slice(0, maxChars);
}
