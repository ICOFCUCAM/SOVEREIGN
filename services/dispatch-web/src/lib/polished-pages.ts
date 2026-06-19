// Client for the Polished Pages document engine — the same Supabase edge
// functions that power the standalone Polished Pages product, reused here so the
// Dispatch "Polished Pages" department is a second front door onto one engine,
// not a fork of the backend. These functions live on the SOVEREIGN Supabase
// project (separate from the Dispatch API), so this client talks to Supabase
// directly with the public anon key, independent of the Dispatch session token.
//
// URL/key are overridable via Vite env; the defaults are the public SOVEREIGN
// anon credentials (safe to ship to the browser by design).

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://qvjdivcdefuprnenedje.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";

async function callFn<T>(name: string, body: unknown): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  let json: unknown = null;
  try { json = await r.json(); } catch { /* non-json */ }
  if (!r.ok) {
    const msg = (json as { error?: string })?.error || `Request failed (HTTP ${r.status})`;
    throw new Error(msg);
  }
  return json as T;
}

// ---- CV ----
export interface CvPersonalInfo {
  fullName: string; email: string; phone?: string; location?: string;
  linkedin?: string; website?: string; summary?: string;
}
export interface CvExperience { title: string; company: string; startDate: string; endDate?: string; description: string }
export interface CvEducation { degree: string; field: string; institution: string; year: string }
export interface CvReference { name: string; title: string; company: string; email: string; phone: string; relationship: string }
export interface CvRequest {
  personalInfo: CvPersonalInfo; experiences: CvExperience[]; education: CvEducation[];
  skills: string[]; certifications: string[]; languages: string[]; references: CvReference[];
  targetJob?: string; template: string;
}
export const generateCv = (req: CvRequest) =>
  callFn<{ cv: string; template: string; layout: string }>("generate-cv", req);

// ---- Cover letter ----
export interface CoverLetterRequest {
  fullName: string; email: string; phone?: string;
  jobDescription: string; relevantExperience?: string; tone: string;
}
export const generateCoverLetter = (req: CoverLetterRequest) =>
  callFn<{ coverLetter: string }>("generate-cover-letter", req);

// ---- Book ----
export interface BookChapter { title: string; summary?: string; keyPoints?: string[]; hook?: string; notes?: string }
export interface BookOutline {
  title: string; subtitle?: string; description?: string; targetAudience?: string;
  positioning?: string; keywords?: string[]; categories?: string[];
  chapters: BookChapter[];
}
export const generateBookOutline = (req: { bookTitle: string; genre: string; targetAudience: string; depth: string; mode: string }) =>
  callFn<{ outline: BookOutline }>("generate-book-outline", req);

export const generateBookChapter = (req: {
  bookTitle: string; genre: string; targetAudience: string;
  chapters: BookChapter[]; chapterIndex: number; depth: string; previousChapters: string[];
}) => callFn<{ chapter: string }>("generate-book-chapter", req);

export const improveBookContent = (req: { content: string; improvementType: string; bookContext?: string }) =>
  callFn<{ content: string }>("improve-book-content", req);

export const repurposeContent = (req: { bookContent: string; bookTitle: string; assetType: string }) =>
  callFn<{ content: string; assetType: string }>("repurpose-content", req);

// CV templates the engine understands, grouped for the picker. The engine holds
// the per-template structural logic; the frontend only passes the key.
export const CV_TEMPLATE_GROUPS: { group: string; options: { value: string; label: string }[] }[] = [
  { group: "Classic", options: [
    { value: "professional", label: "Professional" }, { value: "traditional", label: "Traditional" },
    { value: "chronological", label: "Chronological" }, { value: "functional", label: "Functional" },
    { value: "combination", label: "Combination" }, { value: "classic-elegant", label: "Classic Elegant" },
  ]},
  { group: "Modern", options: [
    { value: "modern", label: "Modern" }, { value: "metro", label: "Metro" }, { value: "sleek", label: "Sleek" },
    { value: "startup", label: "Startup" }, { value: "digital-first", label: "Digital First" },
    { value: "tech-modern", label: "Tech Modern" }, { value: "flat-design", label: "Flat Design" },
  ]},
  { group: "Creative", options: [
    { value: "creative", label: "Creative" }, { value: "portfolio", label: "Portfolio" },
    { value: "artistic", label: "Artistic" }, { value: "storyteller", label: "Storyteller" },
    { value: "infographic", label: "Infographic" }, { value: "magazine", label: "Magazine" },
    { value: "brand-identity", label: "Brand Identity" },
  ]},
  { group: "Industry", options: [
    { value: "engineering", label: "Engineering" }, { value: "healthcare", label: "Healthcare" },
    { value: "legal", label: "Legal" }, { value: "finance", label: "Finance" },
    { value: "education-sector", label: "Education" }, { value: "marketing", label: "Marketing" },
    { value: "hospitality", label: "Hospitality" }, { value: "government", label: "Government" },
  ]},
  { group: "Academic", options: [
    { value: "academic-cv", label: "Academic CV" }, { value: "research", label: "Research Scientist" },
    { value: "phd-candidate", label: "PhD Candidate" }, { value: "postdoc", label: "Postdoctoral" },
    { value: "professor", label: "Professor" },
  ]},
  { group: "Executive", options: [
    { value: "executive", label: "Executive" }, { value: "c-suite", label: "C-Suite" },
    { value: "board-director", label: "Board Director" }, { value: "senior-manager", label: "Senior Manager" },
    { value: "consultant", label: "Consultant" }, { value: "entrepreneur", label: "Entrepreneur" },
  ]},
  { group: "Minimalist", options: [
    { value: "minimal", label: "Minimal" }, { value: "zen", label: "Zen" }, { value: "one-page", label: "One Page" },
    { value: "swiss", label: "Swiss" }, { value: "clean-slate", label: "Clean Slate" },
  ]},
  { group: "Regional", options: [
    { value: "europass", label: "Europass (EU)" }, { value: "uk-standard", label: "UK Standard" },
    { value: "nordic", label: "Nordic" }, { value: "australian", label: "Australian" }, { value: "canadian", label: "Canadian" },
  ]},
  { group: "Specialty", options: [
    { value: "career-change", label: "Career Change" }, { value: "freelancer", label: "Freelancer" },
    { value: "military-transition", label: "Military Transition" }, { value: "internship", label: "Internship / Entry" },
    { value: "remote-worker", label: "Remote Worker" }, { value: "volunteer-focused", label: "Volunteer / Social Impact" },
  ]},
];
