import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Field, inputCls } from "../../lib/ui";
import {
  generateCv, CV_TEMPLATE_GROUPS,
  type CvExperience, type CvEducation, type CvReference,
} from "../../lib/polished-pages";
import ResultPanel from "./ResultPanel";

const blankExp = (): CvExperience => ({ title: "", company: "", startDate: "", endDate: "", description: "" });
const blankEdu = (): CvEducation => ({ degree: "", field: "", institution: "", year: "" });
const blankRef = (): CvReference => ({ name: "", title: "", company: "", email: "", phone: "", relationship: "" });

const Cv: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState<CvExperience[]>([blankExp()]);
  const [education, setEducation] = useState<CvEducation[]>([blankEdu()]);
  const [references, setReferences] = useState<CvReference[]>([]);
  const [skills, setSkills] = useState("");
  const [certifications, setCertifications] = useState("");
  const [languages, setLanguages] = useState("");
  const [targetJob, setTargetJob] = useState("");
  const [template, setTemplate] = useState("professional");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const csv = (s: string): string[] => s.split(",").map((x) => x.trim()).filter(Boolean);
  const canSubmit = fullName.trim() && email.trim() && !busy;

  const onGenerate = async (): Promise<void> => {
    setErr(null); setBusy(true); setResult(null);
    try {
      const r = await generateCv({
        personalInfo: { fullName, email, phone, location, linkedin, website, summary },
        experiences: experiences.filter((e) => e.title.trim()),
        education: education.filter((e) => e.degree.trim()),
        skills: csv(skills), certifications: csv(certifications), languages: csv(languages),
        references: references.filter((r) => r.name.trim()),
        targetJob, template,
      });
      setResult(r.cv);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed");
    } finally { setBusy(false); }
  };

  const upd = <T,>(list: T[], set: (v: T[]) => void, i: number, patch: Partial<T>): void =>
    set(list.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div>
      <header className="mb-6">
        <Link to="/console/polished" className="text-[11px] uppercase tracking-wide text-white/40 hover:text-white/70">← Polished Pages</Link>
        <h1 className="mt-1 text-2xl font-bold text-white">CV / Résumé</h1>
        <p className="text-sm text-white/50">Generate an ATS-ready CV from structured details across 40+ templates.</p>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Personal</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
              <Field label="Email"><input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Phone"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              <Field label="Location"><input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
              <Field label="LinkedIn"><input className={inputCls} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} /></Field>
              <Field label="Website"><input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} /></Field>
            </div>
            <Field label="Professional summary (optional)" hint="Left blank, the engine writes one from your experience.">
              <textarea className={`${inputCls} h-20 leading-relaxed`} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </Field>
          </Card>

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Experience</h3>
              <Button variant="ghost" onClick={() => setExperiences([...experiences, blankExp()])}>+ Add role</Button>
            </div>
            {experiences.map((exp, i) => (
              <div key={i} className="space-y-3 rounded-md border border-white/10 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} placeholder="Title" value={exp.title} onChange={(e) => upd(experiences, setExperiences, i, { title: e.target.value })} />
                  <input className={inputCls} placeholder="Company" value={exp.company} onChange={(e) => upd(experiences, setExperiences, i, { company: e.target.value })} />
                  <input className={inputCls} placeholder="Start (e.g. Jan 2020)" value={exp.startDate} onChange={(e) => upd(experiences, setExperiences, i, { startDate: e.target.value })} />
                  <input className={inputCls} placeholder="End (or blank = Present)" value={exp.endDate} onChange={(e) => upd(experiences, setExperiences, i, { endDate: e.target.value })} />
                </div>
                <textarea className={`${inputCls} h-20`} placeholder="What you did and achieved (with metrics)." value={exp.description} onChange={(e) => upd(experiences, setExperiences, i, { description: e.target.value })} />
                {experiences.length > 1 && <button onClick={() => setExperiences(experiences.filter((_, j) => j !== i))} className="text-[11px] uppercase tracking-wide text-red-300/70 hover:text-red-300">Remove</button>}
              </div>
            ))}
          </Card>

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Education</h3>
              <Button variant="ghost" onClick={() => setEducation([...education, blankEdu()])}>+ Add</Button>
            </div>
            {education.map((edu, i) => (
              <div key={i} className="grid gap-3 rounded-md border border-white/10 p-3 sm:grid-cols-2">
                <input className={inputCls} placeholder="Degree" value={edu.degree} onChange={(e) => upd(education, setEducation, i, { degree: e.target.value })} />
                <input className={inputCls} placeholder="Field" value={edu.field} onChange={(e) => upd(education, setEducation, i, { field: e.target.value })} />
                <input className={inputCls} placeholder="Institution" value={edu.institution} onChange={(e) => upd(education, setEducation, i, { institution: e.target.value })} />
                <input className={inputCls} placeholder="Year" value={edu.year} onChange={(e) => upd(education, setEducation, i, { year: e.target.value })} />
                {education.length > 1 && <button onClick={() => setEducation(education.filter((_, j) => j !== i))} className="text-[11px] uppercase tracking-wide text-red-300/70 hover:text-red-300 sm:col-span-2">Remove</button>}
              </div>
            ))}
          </Card>

          <Card className="space-y-4 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Skills & languages</h3>
            <Field label="Skills" hint="Comma-separated."><input className={inputCls} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Leadership" /></Field>
            <Field label="Certifications" hint="Comma-separated."><input className={inputCls} value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="PMP, AWS Solutions Architect" /></Field>
            <Field label="Languages" hint="Comma-separated."><input className={inputCls} value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English (Native), Spanish (B2)" /></Field>
          </Card>

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">References (optional)</h3>
              <Button variant="ghost" onClick={() => setReferences([...references, blankRef()])}>+ Add</Button>
            </div>
            {references.length === 0 && <p className="text-[12px] text-white/40">None — the CV will say “References available upon request” if the template calls for it.</p>}
            {references.map((ref, i) => (
              <div key={i} className="grid gap-3 rounded-md border border-white/10 p-3 sm:grid-cols-2">
                <input className={inputCls} placeholder="Name" value={ref.name} onChange={(e) => upd(references, setReferences, i, { name: e.target.value })} />
                <input className={inputCls} placeholder="Title" value={ref.title} onChange={(e) => upd(references, setReferences, i, { title: e.target.value })} />
                <input className={inputCls} placeholder="Company" value={ref.company} onChange={(e) => upd(references, setReferences, i, { company: e.target.value })} />
                <input className={inputCls} placeholder="Relationship" value={ref.relationship} onChange={(e) => upd(references, setReferences, i, { relationship: e.target.value })} />
                <input className={inputCls} placeholder="Email" value={ref.email} onChange={(e) => upd(references, setReferences, i, { email: e.target.value })} />
                <input className={inputCls} placeholder="Phone" value={ref.phone} onChange={(e) => upd(references, setReferences, i, { phone: e.target.value })} />
                <button onClick={() => setReferences(references.filter((_, j) => j !== i))} className="text-[11px] uppercase tracking-wide text-red-300/70 hover:text-red-300 sm:col-span-2">Remove</button>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Template</h3>
            <select className={inputCls} value={template} onChange={(e) => setTemplate(e.target.value)}>
              {CV_TEMPLATE_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
          </Card>
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Target role (optional)</h3>
            <input className={inputCls} value={targetJob} onChange={(e) => setTargetJob(e.target.value)} placeholder="Senior Product Manager" />
          </Card>
          <Button onClick={onGenerate} disabled={!canSubmit} className="w-full">{busy ? "Generating…" : "Generate CV →"}</Button>
        </div>
      </div>

      {result && <div className="mt-6"><ResultPanel title="CV" content={result} filename="cv.md" /></div>}
    </div>
  );
};

export default Cv;
