import { describe, it, expect } from "vitest";
import { formToCvData, cvDataToMarkdown, type CvFormState } from "@/lib/cv-data";

const baseForm = (over: Partial<CvFormState> = {}): CvFormState => ({
  personalInfo: { fullName: "Jane Doe", email: "jane@example.com", phone: "", location: "Oslo", linkedin: "", website: "", summary: "Senior PM." },
  experiences: [
    { id: "1", title: "Senior PM", company: "Equinor", startDate: "2021", endDate: "Present", description: "Did A\nDid B\n" },
  ],
  education: [{ id: "1", degree: "MSc", field: "CS", institution: "NTNU", year: "2015" }],
  skills: "Strategy, Roadmapping , ,Discovery",
  certifications: "CSPO",
  languages: "English (Fluent)",
  references: [{ id: "1", name: "Henrik", title: "VP", company: "Equinor", email: "h@e.com", phone: "", relationship: "Manager" }],
  ...over,
});

describe("formToCvData", () => {
  it("maps core fields and splits bullets on newlines", () => {
    const d = formToCvData(baseForm());
    expect(d.name).toBe("Jane Doe");
    expect(d.experiences[0].bullets).toEqual(["Did A", "Did B"]);
    expect(d.contact.location).toBe("Oslo");
  });

  it("parses comma lists and drops empty entries", () => {
    const d = formToCvData(baseForm());
    expect(d.skills).toEqual(["Strategy", "Roadmapping", "Discovery"]);
  });

  it("falls back to a placeholder name and derives title from experience", () => {
    const d = formToCvData(baseForm({ personalInfo: { ...baseForm().personalInfo, fullName: "" } }));
    expect(d.name).toBe("Your Name");
    expect(d.title).toBe("Senior PM");
  });

  it("prefers an explicit target job as the title", () => {
    const d = formToCvData(baseForm({ targetJob: "  Head of Product  " }));
    expect(d.title).toBe("Head of Product");
  });

  it("filters out blank experiences and education", () => {
    const d = formToCvData(baseForm({
      experiences: [{ id: "x", title: "", company: "", startDate: "", endDate: "", description: "" }],
      education: [{ id: "x", degree: "", field: "", institution: "", year: "" }],
    }));
    expect(d.experiences).toHaveLength(0);
    expect(d.education).toHaveLength(0);
  });
});

describe("cvDataToMarkdown", () => {
  it("emits standard sections", () => {
    const md = cvDataToMarkdown(formToCvData(baseForm()));
    expect(md).toContain("# Jane Doe");
    expect(md).toContain("## Experience");
    expect(md).toContain("Equinor");
    expect(md).toContain("## Education");
    expect(md).toContain("## Skills");
    expect(md).toContain("- Did A");
  });
});
