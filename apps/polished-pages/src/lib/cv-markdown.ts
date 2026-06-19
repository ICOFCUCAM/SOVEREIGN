import type { PersonalInfo, Experience, Education, Reference } from "@/types/cv";

// Assemble a CV markdown directly from the form fields, so the live preview can
// show the user's real details in the chosen design before any AI call. Section
// order leads with the sidebar-friendly blocks (skills/languages/certs) so the
// designed two-column templates fill correctly; "Generate" later replaces this
// with the AI-polished version rendered by the same component.
export interface FormCv {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  education: Education[];
  skills: string;
  certifications: string;
  languages: string;
  references: Reference[];
}

const csv = (s: string): string[] => s.split(",").map((x) => x.trim()).filter(Boolean);

export function buildCvMarkdown(f: FormCv): string {
  const p = f.personalInfo;
  const lines: string[] = [];

  lines.push(`# ${p.fullName || "Your Name"}`);
  const contact = [p.email, p.phone, p.location].filter(Boolean).join(" · ");
  if (contact) lines.push(contact);
  const links = [p.linkedin, p.website].filter(Boolean).join(" · ");
  if (links) lines.push(links);

  const skills = csv(f.skills);
  if (skills.length) lines.push("", "## Skills", ...skills.map((s) => `- ${s}`));

  const langs = csv(f.languages);
  if (langs.length) lines.push("", "## Languages", ...langs.map((s) => `- ${s}`));

  const certs = csv(f.certifications);
  if (certs.length) lines.push("", "## Certifications", ...certs.map((s) => `- ${s}`));

  lines.push("", "## Summary", p.summary?.trim() || "_Add a professional summary, or generate with AI to write one for you._");

  const exps = f.experiences.filter((e) => e.title?.trim() || e.company?.trim());
  if (exps.length) {
    lines.push("", "## Experience");
    for (const e of exps) {
      lines.push(`### ${[e.title, e.company].filter(Boolean).join(" — ")}`);
      const dates = [e.startDate, e.endDate || "Present"].filter(Boolean).join(" – ");
      if (dates.trim() && dates !== "Present") lines.push(dates);
      if (e.description?.trim()) {
        for (const d of e.description.split("\n").map((x) => x.trim()).filter(Boolean)) lines.push(`- ${d}`);
      }
      lines.push("");
    }
  }

  const edu = f.education.filter((e) => e.degree?.trim() || e.institution?.trim());
  if (edu.length) {
    lines.push("", "## Education");
    for (const e of edu) {
      lines.push(`### ${[e.degree, e.field].filter(Boolean).join(" in ")}`);
      const inst = [e.institution, e.year].filter(Boolean).join(" · ");
      if (inst) lines.push(inst);
      lines.push("");
    }
  }

  const refs = f.references.filter((r) => r.name?.trim());
  if (refs.length) {
    lines.push("", "## References");
    for (const r of refs) lines.push(`- ${[r.name, r.title, r.company && `at ${r.company}`].filter(Boolean).join(", ")}`);
  }

  return lines.join("\n");
}
