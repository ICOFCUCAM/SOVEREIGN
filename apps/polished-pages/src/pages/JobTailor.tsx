import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Target, Upload, FileText, Check, ArrowLeft, FileDown, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authHeader } from "@/lib/session";
import { extractFileText, CV_ACCEPT, CV_MIME } from "@/lib/extract-file-text";
import { formToCvData, cvDataToMarkdown, type CvData, type CvFormState } from "@/lib/cv-data";
import { elementToPdf } from "@/lib/export-pdf";
import PremiumCv from "@/components/PremiumCv";
import { PREMIUM_TEMPLATES, getPremiumTemplate } from "@/lib/premium-templates";

interface TailorAnalysis {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  recommendations: string[];
}
interface TailorResult {
  tailored: {
    personalInfo: { fullName?: string; email?: string; phone?: string; location?: string; linkedin?: string; website?: string; summary?: string };
    experiences?: { title?: string; company?: string; startDate?: string; endDate?: string; description?: string }[];
    education?: { degree?: string; field?: string; institution?: string; year?: string }[];
    skills?: string;
    certifications?: string;
    languages?: string;
    references?: { name?: string; title?: string; company?: string; email?: string; phone?: string; relationship?: string }[];
  };
  coverLetter: string;
  analysis: TailorAnalysis;
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

// Coerce the server's tailored payload into the form shape the premium renderer expects.
function toCvData(t: TailorResult["tailored"]): CvData {
  const form: CvFormState = {
    personalInfo: {
      fullName: t.personalInfo?.fullName ?? "",
      email: t.personalInfo?.email ?? "",
      phone: t.personalInfo?.phone ?? "",
      location: t.personalInfo?.location ?? "",
      linkedin: t.personalInfo?.linkedin ?? "",
      website: t.personalInfo?.website ?? "",
      summary: t.personalInfo?.summary ?? "",
    },
    experiences: (t.experiences ?? []).map((e) => ({
      id: uid(), title: e.title ?? "", company: e.company ?? "",
      startDate: e.startDate ?? "", endDate: e.endDate ?? "", description: e.description ?? "",
    })),
    education: (t.education ?? []).map((e) => ({
      id: uid(), degree: e.degree ?? "", field: e.field ?? "", institution: e.institution ?? "", year: e.year ?? "",
    })),
    skills: t.skills ?? "",
    certifications: t.certifications ?? "",
    languages: t.languages ?? "",
    references: (t.references ?? []).map((r) => ({
      id: uid(), name: r.name ?? "", title: r.title ?? "", company: r.company ?? "",
      email: r.email ?? "", phone: r.phone ?? "", relationship: r.relationship ?? "",
    })),
  };
  return formToCvData(form);
}

const letterInline = (s: string): string =>
  s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
const letterHtml = (md: string): string => {
  const body = md.replace(/^#\s+.*$/m, "").trim();
  return body.split("\n").map((raw) => {
    const line = raw.trimEnd();
    if (/^#{1,3}\s+/.test(line)) return `<p style="font-weight:700;margin:1rem 0 .3rem">${letterInline(line.replace(/^#{1,3}\s+/, ""))}</p>`;
    if (line.trim() === "") return `<div style="height:.7rem"></div>`;
    return `<p style="margin:.5rem 0;text-align:justify;line-height:1.75">${letterInline(line)}</p>`;
  }).join("");
};

const JobTailor = () => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [template, setTemplate] = useState("sovereign-executive");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [tab, setTab] = useState<"cv" | "letter" | "match">("match");
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);

  const canSubmit = (file || cvText.trim().length > 40) && jobDescription.trim().length > 40;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!CV_MIME.includes(f.type)) { toast({ title: "Unsupported format", description: "Upload a PDF, DOCX, or TXT.", variant: "destructive" }); return; }
    if (f.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Maximum 5MB.", variant: "destructive" }); return; }
    setFile(f);
  };

  const submit = async () => {
    setLoading(true);
    try {
      let text = cvText.trim();
      if (file) text = await extractFileText(file);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tailor-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ cvText: text, jobDescription }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Tailoring failed" }));
        throw new Error(err.error || "Tailoring failed");
      }
      const data = (await res.json()) as TailorResult;
      if (!data.tailored || !data.analysis) throw new Error("The AI returned an unexpected response. Please try again.");
      setResult(data);
      setTab("match");
    } catch (e) {
      toast({ title: "Tailoring failed", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const cvData = result ? toCvData(result.tailored) : null;
  const premium = getPremiumTemplate(template);

  const exportMd = (text: string, name: string) => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };
  const exportDocx = async (markdown: string, name: string) => {
    setBusy("docx");
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-docx`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: await authHeader() }, body: JSON.stringify({ markdown }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally { setBusy(null); }
  };
  const exportPdf = async (el: HTMLDivElement | null, name: string, bg: string) => {
    if (!el) return;
    setBusy("pdf");
    try { await elementToPdf(el, name, bg); }
    catch (e) { toast({ title: "PDF export failed", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  // ───────────────────────── RESULT VIEW ─────────────────────────
  if (result && cvData) {
    const a = result.analysis;
    const scoreColor = a.matchScore >= 75 ? "#16a34a" : a.matchScore >= 50 ? "#d97706" : "#dc2626";
    const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="text-sm font-medium text-muted-foreground font-sans">Tailored application</span>
            <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> New tailoring
            </Button>
          </div>
        </nav>

        <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
          {/* tab switcher */}
          <div className="mb-6 inline-flex rounded-lg border border-border bg-card p-1">
            {([["match", "Match analysis"], ["cv", "Tailored CV"], ["letter", "Cover letter"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium font-sans transition ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "match" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="border-border">
                <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4" style={{ borderColor: scoreColor }}>
                    <span className="text-3xl font-bold" style={{ color: scoreColor }}>{a.matchScore}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">match</span>
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold">Fit assessment</h2>
                    <p className="mt-1 text-sm text-muted-foreground font-sans">{a.summary}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Card className="border-border">
                  <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 font-serif text-base"><Check className="h-4 w-4 text-green-600" /> Strengths matched</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-1.5">
                    {a.matchedKeywords?.length ? a.matchedKeywords.map((k, i) => (
                      <span key={i} className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-700 font-sans">{k}</span>
                    )) : <span className="text-xs text-muted-foreground">None detected.</span>}
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 font-serif text-base"><X className="h-4 w-4 text-amber-600" /> Gaps to address</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-1.5">
                    {a.missingKeywords?.length ? a.missingKeywords.map((k, i) => (
                      <span key={i} className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 font-sans">{k}</span>
                    )) : <span className="text-xs text-muted-foreground">No major gaps — strong alignment.</span>}
                  </CardContent>
                </Card>
              </div>

              {a.recommendations?.length ? (
                <Card className="border-border">
                  <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Recommendations</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {a.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-foreground font-sans">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{r}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
              <p className="text-center text-xs text-muted-foreground font-sans">
                The tailored CV uses only what your original CV supports — gaps above are reported honestly, never invented into the résumé.
              </p>
            </motion.div>
          )}

          {tab === "cv" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-sans"
                >
                  {PREMIUM_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}{t.flagship ? " ★" : ""}</option>)}
                </select>
                <div className="ml-auto flex gap-2">
                  <Button variant="heroOutline" size="sm" onClick={() => exportMd(cvDataToMarkdown(cvData), "tailored-cv.md")}>
                    <Download className="w-4 h-4 mr-1" /> .md
                  </Button>
                  <Button variant="heroOutline" size="sm" disabled={busy === "docx"} onClick={() => exportDocx(cvDataToMarkdown(cvData), "tailored-cv.docx")}>
                    {busy === "docx" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />} .docx
                  </Button>
                  <Button variant="hero" size="sm" disabled={busy === "pdf"} onClick={() => exportPdf(cvRef.current, "tailored-cv.pdf", premium?.dark ? "#0f172a" : "#ffffff")}>
                    {busy === "pdf" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />} .pdf
                  </Button>
                </div>
              </div>
              <PremiumCv data={cvData} template={template} innerRef={cvRef} />
            </motion.div>
          )}

          {tab === "letter" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-4 flex justify-end gap-2">
                <Button variant="heroOutline" size="sm" onClick={() => exportMd(result.coverLetter, "cover-letter.md")}>
                  <Download className="w-4 h-4 mr-1" /> .md
                </Button>
                <Button variant="heroOutline" size="sm" disabled={busy === "docx"} onClick={() => exportDocx(result.coverLetter, "cover-letter.docx")}>
                  {busy === "docx" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />} .docx
                </Button>
                <Button variant="hero" size="sm" disabled={busy === "pdf"} onClick={() => exportPdf(letterRef.current, "cover-letter.pdf", "#ffffff")}>
                  {busy === "pdf" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />} .pdf
                </Button>
              </div>
              <div ref={letterRef} className="rounded-xl border font-serif p-10 md:p-14 shadow-premium leading-relaxed" style={{ background: "#ffffff", color: "#1a1a1a", borderColor: "rgba(31,58,95,0.2)" }}>
                <div style={{ borderBottom: "2px solid #1f3a5f", paddingBottom: ".7rem", marginBottom: "1.4rem" }}>
                  <div style={{ fontSize: "1.9rem", fontWeight: 700, color: "#1f3a5f" }}>{cvData.name}</div>
                  <div style={{ color: "#555", marginTop: ".2rem", fontSize: ".95rem" }}>{[cvData.contact.email, cvData.contact.phone].filter(Boolean).join("  ·  ")}</div>
                </div>
                <div style={{ color: "#666", fontSize: ".9rem", marginBottom: "1.4rem" }}>{today}</div>
                <div dangerouslySetInnerHTML={{ __html: letterHtml(result.coverLetter) }} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ───────────────────────── INPUT VIEW ─────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
            <Target className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold-light font-medium font-sans">Tailor to a Job</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">
            Match your CV to <span className="text-gradient-gold italic">any job</span>
          </h1>
          <p className="text-muted-foreground font-sans">
            Upload your CV and paste a job posting. We'll re-focus your CV, write a matching cover letter, and score your fit — using only what your real experience supports.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-serif text-lg">1 · Your current CV</CardTitle>
              <CardDescription className="font-sans">Upload a file, or paste the text below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input ref={inputRef} type="file" accept={CV_ACCEPT} className="hidden" onChange={onFile} />
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => inputRef.current?.click()}>
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-7 h-7 text-primary" />
                    <div className="text-left">
                      <p className="font-sans font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-sans text-sm text-muted-foreground">Click to upload (PDF, DOCX, TXT)</p>
                  </>
                )}
              </div>
              <div className="text-center text-xs text-muted-foreground font-sans">or paste</div>
              <Textarea
                placeholder="Paste your existing CV text here..."
                value={cvText}
                onChange={(e) => { setCvText(e.target.value); if (file) setFile(null); }}
                rows={6}
                maxLength={50000}
                className="resize-none"
                disabled={!!file}
              />
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-serif text-lg">2 · The job posting</CardTitle>
              <CardDescription className="font-sans">Paste the full job description from the portal.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={14}
                maxLength={30000}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        <Button variant="hero" size="lg" className="mt-6 w-full py-6" onClick={submit} disabled={!canSubmit || loading}>
          {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Tailoring your application...</> : <><Target className="w-5 h-5 mr-2" /> Tailor CV &amp; cover letter</>}
        </Button>
        {!canSubmit && <p className="mt-2 text-center text-xs text-muted-foreground font-sans">Add your CV (upload or paste) and a job description to continue.</p>}
      </div>
    </div>
  );
};

export default JobTailor;
