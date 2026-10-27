import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpenCheck, CheckCircle2, CircleDashed, GraduationCap, Loader2, MessageSquareQuote, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Manuscript } from "@/lib/manuscript";
import { ask, courseContext, courseFor, indexBook, prepare, saveSettings, usageSummary, type CourseSourceInfo, type IndexProgress, type TeacherAnswer, type TeacherSettings, type UsageSummary } from "@/lib/teacher/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { SourceVersion } from "@/lib/teacher/pipeline";
import { EYEBROW, SERIF } from "./ui";

type Prepared = Awaited<ReturnType<typeof prepare>>;
const STATUS_LABEL: Record<TeacherAnswer["status"], { text: string; tone: string }> = {
  answered: { text: "Answered from the book", tone: "text-[#047857] dark:text-emerald-400" },
  partially_covered: { text: "Partly covered by the book", tone: "text-[#B45309]" },
  not_covered: { text: "Not covered by the book", tone: "text-[#64748B]" },
  out_of_scope: { text: "Outside this course", tone: "text-[#64748B]" },
  pastoral: { text: "Personal question", tone: "text-[#7C3AED]" },
  evidence: { text: "From the book's own words", tone: "text-[#047857] dark:text-emerald-400" },
};

// The AI Teacher for this book (BLUEPRINT.md build steps 1–3, author mode):
// 1 see the chapters exactly as the tutor will read them, 2 confirm and index,
// 3 ask the book and check every answer's evidence. Answers come from the
// Teacher Runtime (the API), never from the owner's Claude Code runner.
export default function TeacherPanel({ m, ensureSaved }: { m: Manuscript; ensureSaved: () => Promise<string | null> }) {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [course, setCourse] = useState<{ id: string; sources: CourseSourceInfo[] } | null>(null);
  const [progress, setProgress] = useState<IndexProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [level, setLevel] = useState<"curious" | "student" | "leader">("student");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<TeacherAnswer | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // An existing tutor for this book (once it has been indexed).
  const refresh = async (libraryId: string) => {
    const id = await courseFor(libraryId).catch(() => null);
    const ctx = id ? await courseContext(id).catch(() => null) : null;
    setCourse(id && ctx ? { id, sources: ctx.sources } : null);
    setUsage(id ? await usageSummary(id).catch(() => null) : null);
  };
  const change = async (patch: Partial<TeacherSettings>) => {
    if (!course) return;
    setSavingSettings(true);
    try { await saveSettings(course.id, patch); setUsage(await usageSummary(course.id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't save the settings."); }
    finally { setSavingSettings(false); }
  };
  useEffect(() => { if (m.libraryId) void refresh(m.libraryId); }, [m.libraryId]);

  const check = async () => {
    setPreparing(true); setError(null);
    try {
      const id = m.libraryId ?? (await ensureSaved());
      if (!id) throw new Error("Save the book to your Library first.");
      setPrepared(await prepare(m, id));
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't read the book."); }
    finally { setPreparing(false); }
  };

  const confirm = async (version: SourceVersion) => {
    setError(null);
    try {
      const id = m.libraryId ?? (await ensureSaved());
      if (!id) throw new Error("Save the book to your Library first.");
      const r = await indexBook({ libraryId: id, title: m.title || "Book tutor", rules: m.rules ?? "", version, onProgress: setProgress });
      if (r.note) setError(`Indexed for keyword search. Meaning-based search is not ready: ${r.note}`);
      await refresh(id);
    } catch (e) { setError(e instanceof Error ? e.message : "Indexing failed."); setProgress(null); }
  };

  const send = async () => {
    if (!course || question.trim().length < 2) return;
    setAsking(true); setAskError(null); setAnswer(null); setOpen(null);
    try { setAnswer(await ask({ courseId: course.id, question: question.trim(), level })); if (course) setUsage(await usageSummary(course.id).catch(() => usage)); }
    catch (e) { setAskError(e instanceof Error ? e.message : "The tutor could not answer."); }
    finally { setAsking(false); }
  };

  const src = course?.sources[0];
  const evidenceText = useMemo(() => new Map((answer?.evidence ?? []).map((e) => [e.evidence_id, e])), [answer]);
  const indexing = progress && progress.step !== "done";

  return (
    <div className="max-w-[880px] space-y-10">
      <header>
        <p className={EYEBROW}>AI Teacher</p>
        <h2 className={`${SERIF} mt-2 text-[26px] font-medium leading-tight`}>A tutor that teaches only this book</h2>
        <p className="mt-2 max-w-[68ch] text-[14px] text-[#475569] dark:text-[#CBD5E1]">Every answer is built from passages of your book, cites them, and is checked before it is shown: citations must point to passages the tutor was given, quotations must match your text exactly, and your terminology rules apply to everything the tutor writes. When the book does not answer a question, it says so.</p>
      </header>

      {/* Step 1–2: what the tutor will read, then confirm and index */}
      <section aria-labelledby="t-index-h" className="rounded-[12px] border border-[#E6E8ED] bg-white p-5 dark:border-white/10 dark:bg-[#161A22]">
        <div className="flex flex-wrap items-center gap-3">
          <BookOpenCheck className="h-5 w-5 text-[#2563EB]" aria-hidden />
          <h3 id="t-index-h" className="flex-1 font-sans text-[15px] font-semibold">The book the tutor reads</h3>
          {src && <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#047857] dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Indexed · {src.passages.toLocaleString()} passages{src.embedded < src.passages ? ` · meaning search ${src.embedded}/${src.passages}` : ""}</span>}
        </div>
        <p className="mt-1 text-[13px] text-[#64748B]">Check the chapters as the tutor will see them before anything is indexed. Indexing a new version replaces the one the tutor teaches from; the old one is kept.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void check()} disabled={preparing || Boolean(indexing)}>{preparing ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Search className="h-4 w-4" />} {course ? "Check the current text again" : "Check the chapters"}</Button>
        </div>

        {prepared && (
          <div className="mt-5 border-t border-[#E6E8ED] pt-5 dark:border-white/10">
            {prepared.preview.issues.length > 0 && (
              <ul className="mb-4 space-y-1.5 text-[13px]" aria-label="Structure issues">
                {prepared.preview.issues.map((i, n) => <li key={n} className={`flex gap-2 ${i.level === "error" ? "text-[#B91C1C]" : "text-[#92400E] dark:text-[#FBBF24]"}`}><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{i.message}</li>)}
              </ul>
            )}
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Chapters as the tutor will read them</caption>
              <thead className="text-[11.5px] uppercase tracking-[0.08em] text-[#64748B]"><tr><th className="py-1.5 font-semibold">Chapter</th><th className="font-semibold">Title</th><th className="text-right font-semibold">Paragraphs</th><th className="text-right font-semibold">Passages</th><th className="hidden font-semibold md:table-cell">Scripture</th></tr></thead>
              <tbody>
                {prepared.preview.chapters.map((c) => (
                  <tr key={c.id} className="border-t border-[#F1F5F9] dark:border-white/5">
                    <td className="py-2 pr-3 text-[#64748B]">{c.label}</td>
                    <td className={`${SERIF} pr-3 text-[14.5px]`}>{c.title}</td>
                    <td className="text-right tabular-nums">{c.paragraphs}</td>
                    <td className="text-right tabular-nums">{c.chunks}</td>
                    <td className="hidden truncate pl-4 text-[12px] text-[#64748B] md:table-cell" title={c.scripture.join(", ")}>{c.scripture.slice(0, 4).join(", ")}{c.scripture.length > 4 ? ` +${c.scripture.length - 4}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={() => void confirm(prepared.version)} disabled={prepared.preview.blocking || Boolean(indexing)}>
                {indexing ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {progress?.step === "embedding" ? `Indexing meaning (${progress.remaining} left)…` : "Saving the version…"}</> : <><ShieldCheck className="h-4 w-4" /> These chapters are right: index the book</>}
              </Button>
              <span className="text-[12.5px] text-[#64748B]">{prepared.version.chunks.length.toLocaleString()} passages · version {prepared.version.contentHash.slice(0, 8)}</span>
            </div>
            {prepared.preview.blocking && <p className="mt-2 text-[13px] text-[#B91C1C]">Fix the errors above in Write first.</p>}
          </div>
        )}
        {error && <p role="alert" className="mt-4 text-[13px] text-[#B45309]">{error}</p>}
      </section>

      {/* How the tutor answers (BLUEPRINT.md §12): from the book only by default; AI explanations only if turned on, within caps. */}
      {course && usage && (
        <section aria-labelledby="t-mode-h" className="rounded-[12px] border border-[#E6E8ED] bg-white p-5 dark:border-white/10 dark:bg-[#161A22]">
          <h3 id="t-mode-h" className="font-sans text-[15px] font-semibold">How the tutor answers</h3>
          <p className="mt-1 text-[13px] text-[#64748B]">By default the tutor answers from your book's own words and costs nothing per question. Questions the book doesn't cover get an honest "not covered".</p>
          <div className="mt-4 space-y-4 text-[13.5px]">
            <label className="flex items-start gap-3">
              <Switch checked={usage.settings.ai_answers} disabled={savingSettings} onCheckedChange={(v) => void change({ ai_answers: v })} aria-label="AI explanations" />
              <span><span className="font-medium">AI explanations</span> <span className="text-[#64748B]">· off by default. When on, the tutor may write an explanation in its own words from the book's passages, checked before it is shown. Uses the API, billed per use, within the caps below.</span></span>
            </label>
            {usage.settings.ai_answers && (
              <div className="flex flex-wrap items-center gap-3 pl-12 text-[13px]">
                <label className="flex items-center gap-2">At most <Input type="number" min={0} className="h-8 w-24" defaultValue={usage.settings.monthly_request_cap} aria-label="AI explanations per month" onBlur={(e) => void change({ monthly_request_cap: Number(e.target.value) || 0 })} /> explanations a month</label>
                <label className="flex items-center gap-2">and <Input type="number" min={0} className="h-8 w-32" defaultValue={usage.settings.monthly_token_cap} aria-label="Tokens per month" onBlur={(e) => void change({ monthly_token_cap: Number(e.target.value) || 0 })} /> tokens</label>
              </div>
            )}
            <label className="flex items-start gap-3">
              <Switch checked={usage.settings.vector_search} disabled={savingSettings} onCheckedChange={(v) => void change({ vector_search: v })} aria-label="Meaning-based search" />
              <span><span className="font-medium">Meaning-based search</span> <span className="text-[#64748B]">· off by default. Finds passages by meaning as well as by words; uses OpenAI once to index the book and once per question. Re-index after turning it on.</span></span>
            </label>
            <p className="text-[12.5px] text-[#64748B]">Fair use: {usage.settings.per_minute} questions a minute and {usage.settings.per_day} a day per person.</p>
          </div>
          <div className="mt-4 border-t border-[#E6E8ED] pt-3 text-[12.5px] text-[#475569] dark:border-white/10 dark:text-[#CBD5E1]">
            <span className="font-medium">This month:</span> {usage.requests} {usage.requests === 1 ? "question" : "questions"}
            {Object.keys(usage.by_path).length > 0 && <> ({Object.entries(usage.by_path).map(([k, n]) => `${n} ${k === "evidence_only" ? "from the book" : k === "not_covered" ? "not covered" : k === "out_of_scope" ? "outside the course" : k === "insufficient" ? "not enough in the book" : k === "model" ? "with AI" : k}`).join(", ")})</>}
            {usage.model_calls.length > 0 ? <> · paid calls: {usage.model_calls.map((c) => `${c.calls} ${c.task.replace(/_/g, " ")} (${c.provider}, ${(c.tokens_in + c.tokens_out).toLocaleString()} tokens)`).join("; ")}</> : <> · no paid calls</>}
          </div>
        </section>
      )}

      {/* Step 3: ask the book */}
      <section aria-labelledby="t-ask-h" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <GraduationCap className="h-5 w-5 text-[#2563EB]" aria-hidden />
          <h3 id="t-ask-h" className="flex-1 font-sans text-[15px] font-semibold">Ask the book</h3>
          <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
            <SelectTrigger className="h-9 w-[200px]" aria-label="Learner level"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="curious">Curious reader</SelectItem><SelectItem value="student">Serious student</SelectItem><SelectItem value="leader">Study-group leader</SelectItem></SelectContent>
          </Select>
        </div>
        {!course ? <p className="text-[13.5px] text-[#64748B]">Index the book first; then ask it what a student would.</p> : (
          <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="space-y-2">
            <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} aria-label="Question" placeholder="What does the author say about the names of spirits?" className="rounded-[8px] text-[14px]"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void send(); } }} />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={asking || question.trim().length < 2}>{asking ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Reading the book…</> : <><MessageSquareQuote className="h-4 w-4" /> Ask</>}</Button>
              <span className="text-[12px] text-[#64748B]">{usage?.settings.ai_answers ? "AI explanations are on: answers may use the API (billed per use, capped)." : "Answers come from the book: no AI cost."}</span>
            </div>
          </form>
        )}
        {askError && <p role="alert" className="text-[13.5px] text-[#B91C1C]">{askError}</p>}

        {answer && (
          <article aria-label="The tutor's answer" className="rounded-[12px] border border-[#E6E8ED] bg-white p-5 dark:border-white/10 dark:bg-[#161A22]">
            <p className={`text-[12.5px] font-medium ${STATUS_LABEL[answer.status].tone}`}>{STATUS_LABEL[answer.status].text}{answer.validation.repaired ? " · corrected once by the checks" : ""}</p>
            <p className={`${SERIF} mt-2 whitespace-pre-wrap text-[16.5px] leading-[1.65]`}>{answer.answer}</p>
            {answer.notice && <p className="mt-2 text-[13px] text-[#92400E] dark:text-[#FBBF24]">{answer.notice}</p>}
            {answer.passages && answer.passages.length > 0 && (
              <ol className="mt-4 space-y-3" aria-label="Passages from the book">
                {answer.passages.map((p) => (
                  <li key={p.evidence_id}>
                    <p className="text-[12px] font-medium text-[#1D4ED8] dark:text-[#93C5FD]">{p.source_title} · {p.source_location}</p>
                    <blockquote className={`${SERIF} mt-1 border-l-2 border-[#93C5FD] pl-3 text-[15px] leading-[1.65] text-[#334155] dark:text-[#CBD5E1]`}>{p.text}</blockquote>
                  </li>
                ))}
              </ol>
            )}
            {answer.limitations.length > 0 && <ul className="mt-3 space-y-1 text-[13px] text-[#92400E] dark:text-[#FBBF24]">{answer.limitations.map((l) => <li key={l}>• {l}</li>)}</ul>}
            {answer.check_question && <p className="mt-3 text-[13.5px] text-[#475569] dark:text-[#CBD5E1]"><strong className="font-medium">Check yourself:</strong> {answer.check_question}</p>}

            {answer.claims.length > 0 && (
              <div className="mt-5 border-t border-[#E6E8ED] pt-4 dark:border-white/10">
                <p className={EYEBROW}>Claims and their evidence</p>
                <ol className="mt-2 space-y-2.5 text-[13.5px]">
                  {answer.claims.map((c, i) => (
                    <li key={i}>
                      <span>{c.text}</span>{" "}
                      {c.evidence.map((e) => (
                        <button key={e.evidence_id} type="button" onClick={() => setOpen(open === e.evidence_id ? null : e.evidence_id)} aria-expanded={open === e.evidence_id}
                          className="ml-1 rounded-[5px] bg-[#EFF6FF] px-1.5 py-0.5 text-[12px] font-medium text-[#1D4ED8] hover:bg-[#DBEAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:bg-[#172554] dark:text-[#93C5FD]">{e.source_location}</button>
                      ))}
                      {c.evidence.some((e) => e.evidence_id === open) && evidenceText.get(open!) && (
                        <blockquote className={`${SERIF} mt-2 border-l-2 border-[#93C5FD] pl-3 text-[14px] leading-[1.6] text-[#475569] dark:text-[#94A3B8]`}>
                          <span className="mb-1 block font-sans text-[11.5px] text-[#64748B]">{evidenceText.get(open!)!.source_title} · {evidenceText.get(open!)!.source_location}</span>{evidenceText.get(open!)!.text}
                        </blockquote>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {answer.citations.length > 0 && (
              <div className="mt-4">
                <p className={EYEBROW}>Quoted from the book · matched exactly</p>
                <ul className="mt-2 space-y-2">{answer.citations.map((c, i) => <li key={i} className={`${SERIF} text-[14px]`}>“{c.quote}” <span className="font-sans text-[12px] text-[#64748B]">— {c.source_location}</span></li>)}</ul>
              </div>
            )}
            <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-[#64748B]">
              {answer.answered_by === "book" ? <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Answered from the book · no AI used</span> : <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Checked: {(() => { const q = answer.validation.citations_verified ?? 0; const e = answer.retrieval.evidence; return `${q} ${q === 1 ? "quotation" : "quotations"} verified, evidence from ${e} ${e === 1 ? "passage" : "passages"}`; })()}</span>}
              <span>{answer.retrieval.vector ? "keyword + meaning search" : <span className="inline-flex items-center gap-1"><CircleDashed className="h-3 w-3" /> keyword search only</span>}</span>
              {answer.usage && <span>{answer.usage.tokens_in.toLocaleString()} in · {answer.usage.tokens_out.toLocaleString()} out tokens</span>}
            </p>
          </article>
        )}
      </section>
    </div>
  );
}
