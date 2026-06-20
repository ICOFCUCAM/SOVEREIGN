import { authHeader } from "@/lib/session";

export interface StoryCharacter { name: string; appearance: string }
export interface StoryPage { text: string; illustrationPrompt: string; image?: string | null }
export interface Storybook {
  title: string;
  dedication?: string;
  artStyle: string;
  characters: StoryCharacter[];
  coverPrompt: string;
  coverImage?: string | null;
  pages: StoryPage[];
}

export interface StoryInput {
  childName?: string;
  childAge: string;
  readingLevel: string;
  theme: string;
  moralLesson?: string;
  characters?: string;
  pageCount: number;
}

const fn = (name: string) => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

export async function generateStorybook(input: StoryInput): Promise<Storybook> {
  const res = await fetch(fn("generate-storybook"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Could not create the story.");
  }
  const data = (await res.json()) as Storybook;
  if (!data?.pages?.length) throw new Error("The story came back empty. Please try again.");
  data.pages = data.pages.map((p) => ({ ...p, image: null }));
  data.coverImage = null;
  return data;
}

export async function generateIllustration(opts: {
  prompt: string; artStyle?: string; orientation?: "square" | "portrait" | "landscape"; lineArt?: boolean;
}): Promise<string> {
  const res = await fetch(fn("generate-illustration"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Illustration failed.");
  }
  const data = await res.json();
  return data.image as string;
}
