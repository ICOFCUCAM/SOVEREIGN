import { authHeader } from "@/lib/session";

export type SchoolDocType =
  | "reader" | "textbook" | "student-book" | "workbook" | "activity-book" | "revision"
  | "exam-prep" | "homework-pack" | "teacher-guide" | "lesson-notes" | "lesson-plan"
  | "weekly-plan" | "scheme-of-work" | "learning-objectives" | "worksheet" | "quiz"
  | "exam" | "assessment" | "answer-key" | "marking-guide";

export interface SchoolDoc { docType: SchoolDocType; title: string; content: string }

export interface SchoolInput {
  docType: SchoolDocType;
  grade?: string;
  subject?: string;
  topic?: string;
  country?: string;
  term?: string;
  year?: string;
  language?: string;
  exerciseTypes?: string[];
  sourceContent?: string;
  knowledge?: { rules: string; terminology: string; forbidden: string } | null;
}

// Documents whose content must match an earlier paper (generated against it).
export const NEEDS_SOURCE: SchoolDocType[] = ["answer-key", "marking-guide"];
// Document types that constitute "source" papers for the above.
export const SOURCE_TYPES: SchoolDocType[] = ["workbook", "quiz", "exam"];

export async function generateSchoolContent(input: SchoolInput): Promise<SchoolDoc> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-school-content`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Generation failed.");
  }
  return (await res.json()) as SchoolDoc;
}
