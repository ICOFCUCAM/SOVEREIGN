import type { PersonalInfo, Experience, Education, Reference } from "@/types/cv";

// Structured CV model that the premium (designed) templates render from, plus
// mappers: the form state -> CvData, and CvData -> markdown for the .md/.docx
// text exports.
export interface CvData {
  name: string;
  title?: string;
  photo?: string | null;
  contact: { email?: string; phone?: string; location?: string; linkedin?: string; website?: string };
  summary?: string;
  experiences: { title?: string; company?: string; start?: string; end?: string; bullets: string[] }[];
  education: { degree?: string; field?: string; institution?: string; year?: string }[];
  skills: string[];
  languages: string[];
  certifications: string[];
  references: { name?: string; title?: string; company?: string; email?: string; phone?: string }[];
  // Optional sections used by specific premium architectures (shown when present).
  metrics?: { value: string; label: string }[];
  achievements?: string[];
  projects?: { name: string; description?: string; tech?: string }[];
  publications?: string[];
  languageLevels?: { language: string; level: string }[];
  skillGroups?: { label: string; items: string[] }[];
  clearance?: string;
  portfolio?: string;
  github?: string;
}

export interface CvFormState {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  education: Education[];
  skills: string;
  certifications: string;
  languages: string;
  references: Reference[];
  targetJob?: string;
  photo?: string | null;
}

const csv = (s: string): string[] => s.split(",").map((x) => x.trim()).filter(Boolean);

export function formToCvData(f: CvFormState): CvData {
  const p = f.personalInfo;
  return {
    name: p.fullName || "Your Name",
    title: f.targetJob?.trim() || f.experiences.find((e) => e.title?.trim())?.title || undefined,
    photo: f.photo ?? null,
    contact: {
      email: p.email || undefined, phone: p.phone || undefined, location: p.location || undefined,
      linkedin: p.linkedin || undefined, website: p.website || undefined,
    },
    summary: p.summary?.trim() || undefined,
    experiences: f.experiences
      .filter((e) => e.title?.trim() || e.company?.trim())
      .map((e) => ({
        title: e.title || undefined,
        company: e.company || undefined,
        start: e.startDate || undefined,
        end: e.endDate || "Present",
        bullets: (e.description || "").split("\n").map((s) => s.trim()).filter(Boolean),
      })),
    education: f.education
      .filter((e) => e.degree?.trim() || e.institution?.trim())
      .map((e) => ({ degree: e.degree || undefined, field: e.field || undefined, institution: e.institution || undefined, year: e.year || undefined })),
    skills: csv(f.skills),
    languages: csv(f.languages),
    certifications: csv(f.certifications),
    references: f.references
      .filter((r) => r.name?.trim())
      .map((r) => ({ name: r.name || undefined, title: r.title || undefined, company: r.company || undefined, email: r.email || undefined, phone: r.phone || undefined })),
  };
}

export function cvDataToMarkdown(d: CvData): string {
  const lines: string[] = [`# ${d.name}`];
  if (d.title) lines.push(d.title);
  const contact = [d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin, d.contact.website].filter(Boolean).join(" · ");
  if (contact) lines.push(contact);

  if (d.summary) lines.push("", "## Summary", d.summary);

  if (d.experiences.length) {
    lines.push("", "## Experience");
    for (const x of d.experiences) {
      lines.push(`### ${[x.company, x.title].filter(Boolean).join(" — ")}`);
      const dates = [x.start, x.end].filter(Boolean).join(" – ");
      if (dates) lines.push(dates);
      for (const b of x.bullets) lines.push(`- ${b}`);
      lines.push("");
    }
  }

  if (d.education.length) {
    lines.push("", "## Education");
    for (const e of d.education) {
      lines.push(`### ${[e.degree, e.field].filter(Boolean).join(" in ")}`);
      const inst = [e.institution, e.year].filter(Boolean).join(" · ");
      if (inst) lines.push(inst);
    }
  }

  if (d.skills.length) lines.push("", "## Skills", ...d.skills.map((s) => `- ${s}`));
  if (d.languages.length) lines.push("", "## Languages", ...d.languages.map((s) => `- ${s}`));
  if (d.certifications.length) lines.push("", "## Certifications", ...d.certifications.map((s) => `- ${s}`));
  if (d.references.length) {
    lines.push("", "## References");
    for (const r of d.references) lines.push(`- ${[r.name, r.title, r.company && `at ${r.company}`].filter(Boolean).join(", ")}`);
  }

  return lines.join("\n");
}
