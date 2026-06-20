// Deterministic avatar styling from a name — the same author always gets the
// same colour across the app (author page, catalog byline, account), giving
// creators a stable visual identity without requiring an image upload.
const PALETTES = [
  { bg: "bg-career/15", text: "text-career" },
  { bg: "bg-publishing/15", text: "text-publishing" },
  { bg: "bg-educational/15", text: "text-educational" },
  { bg: "bg-marketplace/15", text: "text-marketplace" },
  { bg: "bg-primary/15", text: "text-primary" },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function avatarColors(name: string): { bg: string; text: string } {
  return PALETTES[hash(name.trim().toLowerCase()) % PALETTES.length];
}

export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}
