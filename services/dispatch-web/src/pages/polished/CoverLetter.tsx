import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Field, inputCls } from "../../lib/ui";
import { generateCoverLetter } from "../../lib/polished-pages";
import ResultPanel from "./ResultPanel";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "confident", label: "Confident" },
];

const CoverLetter: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [relevantExperience, setRelevantExperience] = useState("");
  const [tone, setTone] = useState("professional");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const canSubmit = fullName.trim() && email.trim() && jobDescription.trim() && !busy;

  const onGenerate = async (): Promise<void> => {
    setErr(null); setBusy(true); setResult(null);
    try {
      const r = await generateCoverLetter({ fullName, email, phone, jobDescription, relevantExperience, tone });
      setResult(r.coverLetter);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed");
    } finally { setBusy(false); }
  };

  return (
    <div>
      <header className="mb-6">
        <Link to="/console/polished" className="text-[11px] uppercase tracking-wide text-white/40 hover:text-white/70">← Polished Pages</Link>
        <h1 className="mt-1 text-2xl font-bold text-white">Cover Letter</h1>
        <p className="text-sm text-white/50">A tailored cover letter matched to a specific job description.</p>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" /></Field>
            <Field label="Email"><input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" /></Field>
          </div>
          <Field label="Phone (optional)"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" /></Field>
          <Field label="Job description" hint="Paste the posting — the letter is tailored to it.">
            <textarea className={`${inputCls} h-32 leading-relaxed`} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the role's description and requirements." />
          </Field>
          <Field label="Relevant experience (optional)" hint="Achievements to emphasise. Left blank, the engine infers from the posting.">
            <textarea className={`${inputCls} h-24 leading-relaxed`} value={relevantExperience} onChange={(e) => setRelevantExperience(e.target.value)} placeholder="5 years running growth campaigns; led a team of 8…" />
          </Field>
        </Card>

        <div className="space-y-5">
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Tone</h3>
            <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Card>
          <Button onClick={onGenerate} disabled={!canSubmit} className="w-full">{busy ? "Generating…" : "Generate cover letter →"}</Button>
        </div>
      </div>

      {result && <div className="mt-6"><ResultPanel title="Cover letter" content={result} filename="cover-letter.md" /></div>}
    </div>
  );
};

export default CoverLetter;
