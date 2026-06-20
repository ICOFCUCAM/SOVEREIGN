// Single source of truth for the four-studio visual identity, so every surface
// (navigation, cards, studio pages, dashboard, marketplace, pricing) uses the
// same colour language: Career = blue, Publishing = purple, Educational =
// emerald, Marketplace = amber. Classes are literal so Tailwind's JIT keeps them.
export type Studio = "career" | "publishing" | "educational" | "marketplace";

export interface StudioTheme {
  label: string;
  text: string;     // foreground colour
  bg: string;       // tinted background for icon chips
  dot: string;      // solid colour dot
  hoverBorder: string;
  eyebrowBorder: string;
  eyebrowBg: string;
}

export const STUDIO_THEME: Record<Studio, StudioTheme> = {
  career: { label: "Career", text: "text-career", bg: "bg-career/10", dot: "bg-career", hoverBorder: "hover:border-career/50", eyebrowBorder: "border-career/20", eyebrowBg: "bg-career/5" },
  publishing: { label: "Publishing", text: "text-publishing", bg: "bg-publishing/10", dot: "bg-publishing", hoverBorder: "hover:border-publishing/50", eyebrowBorder: "border-publishing/20", eyebrowBg: "bg-publishing/5" },
  educational: { label: "Educational", text: "text-educational", bg: "bg-educational/10", dot: "bg-educational", hoverBorder: "hover:border-educational/50", eyebrowBorder: "border-educational/20", eyebrowBg: "bg-educational/5" },
  marketplace: { label: "Marketplace", text: "text-marketplace", bg: "bg-marketplace/10", dot: "bg-marketplace", hoverBorder: "hover:border-marketplace/50", eyebrowBorder: "border-marketplace/20", eyebrowBg: "bg-marketplace/5" },
};
