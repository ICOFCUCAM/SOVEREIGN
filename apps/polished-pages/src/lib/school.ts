import { authHeader } from "@/lib/session";

export type SchoolDocType = "reader" | "student-book" | "workbook" | "teacher-guide" | "quiz" | "answer-key";
export interface SchoolDoc { docType: SchoolDocType; title: string; content: string }

export interface SchoolInput {
  docType: SchoolDocType;
  grade: string;
  subject: string;
  topic: string;
  country?: string;
  sourceContent?: string;
}

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
