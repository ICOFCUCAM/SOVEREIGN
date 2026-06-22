import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, requirePlanOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Project Knowledge Base / Author Memory — highest-priority rules, terminology
// and forbidden content injected at the top of the system prompt.
function knowledgeBlock(k: unknown): string {
  if (!k || typeof k !== "object") return "";
  const kb = k as { rules?: unknown; terminology?: unknown; forbidden?: unknown };
  const parts: string[] = [];
  const rules = String(kb.rules ?? "").trim();
  const terms = String(kb.terminology ?? "").trim();
  const forbidden = String(kb.forbidden ?? "").trim();
  if (rules) parts.push("WRITING RULES (follow exactly):\n" + rules);
  if (terms) parts.push("APPROVED TERMINOLOGY (always use the preferred term):\n" + terms);
  if (forbidden) parts.push("FORBIDDEN — never use these names, terms or concepts under any circumstances. If one would naturally appear, rephrase using the approved terminology:\n" + forbidden);
  if (!parts.length) return "";
  return "=== PROJECT KNOWLEDGE BASE — HIGHEST PRIORITY. These rules override all default style and must be obeyed. ===\n" + parts.join("\n\n") + "\n=== END KNOWLEDGE BASE ===\n\n";
}

// School-content engine. Generates ONE classroom-ready document per call so a
// pack (textbook + workbook + teacher guide + quiz + answer key, or a full
// curriculum) is produced as a sequence of bounded calls. Documents that must
// match an earlier one (answer key, marking guide) are generated against that
// document's text passed as sourceContent.
const PROMPTS: Record<string, string> = {
  reader: `Write an engaging EDUCATIONAL READER. Pitch the vocabulary and sentence length to the grade/age. Open with a hook, teach the topic through clear, friendly explanation and concrete examples (a short illustrative story or scenario is welcome), and finish with 3-5 simple review questions. Markdown headings.`,
  textbook: `Write a primary/secondary-school TEXTBOOK unit for the topic. Clear learning objectives, structured sections with subheadings, accurate explanations pitched to the grade, worked examples, key-term callouts, "Did you know?" boxes, and a unit summary. Where a picture would help, add a line like "[Illustration: ...]". Markdown.`,
  "student-book": `Write a STUDENT BOOK / lesson for the topic. Clear objectives, structured explanation in short sections with subheadings, worked examples, key-term callouts and a short summary. Age- and grade-appropriate. Markdown.`,
  workbook: `Create a STUDENT WORKBOOK of exercises for the topic (NO answers — student copy). Use the requested exercise types where given. Number every question and leave clear space cues for writing. Markdown.`,
  "activity-book": `Create an ACTIVITY BOOK of fun, varied, hands-on activities for the topic — puzzles, draw-and-label, matching, simple projects. Age-appropriate and engaging. Markdown.`,
  revision: `Create a REVISION BOOK: concise summaries of the key points for the topic, with worked examples and a set of practice questions. Markdown.`,
  "exam-prep": `Create an EXAM PREPARATION pack for the topic: the key topics to master, worked examples, common pitfalls, practice questions and exam technique tips. Markdown.`,
  "homework-pack": `Create a HOMEWORK PACK: short daily exercises for one week (Day 1–5), each a quick, focused set on the topic. Markdown.`,
  "teacher-guide": `Write a TEACHER GUIDE: lesson objectives, materials, a step-by-step lesson plan with timings, key talking points, common misconceptions, differentiation tips and extension activities. Markdown.`,
  "lesson-notes": `Write clear LESSON NOTES the teacher can teach directly from: structured explanation, board notes, examples to use, and questions to ask the class. Markdown.`,
  "lesson-plan": `Write a detailed LESSON PLAN: objectives, prior knowledge, materials, introduction, development steps with timings, learner activities, assessment for learning, closure and homework. Markdown.`,
  "weekly-plan": `Produce a WEEKLY PLAN: for each day (Monday–Friday) the lesson focus, objectives, activities and resources for the topic/subject. Markdown.`,
  "scheme-of-work": `Produce a SCHEME OF WORK for the term as a week-by-week table: week, topic, objectives, teaching activities, resources and assessment. Cover the whole term coherently. Markdown.`,
  "learning-objectives": `List clear, measurable LEARNING OBJECTIVES for the topic aligned to the grade — organised by knowledge, skills and attitudes/values. Markdown.`,
  worksheet: `Create a single WORKSHEET of varied exercises for the topic (student copy, NO answers). Number every question. Markdown.`,
  quiz: `Create a QUIZ on the topic (questions only — NO answers). 8-12 numbered questions of varied types, increasing in difficulty. Markdown.`,
  exam: `Create an EXAM paper for the topic/subject: a header (subject, grade, time, total marks), clear sections, instructions, and numbered questions with mark allocations. NO answers. Markdown.`,
  assessment: `Create an ASSESSMENT / test for the topic with a header, varied questions, mark allocations and a short marking rubric at the end. Markdown.`,
  "answer-key": `Produce an ANSWER KEY (teacher copy) with the correct answer to EVERY numbered question in the provided workbook/quiz. Match the exact numbering. Add brief explanations where helpful. Markdown.`,
  "marking-guide": `Produce a MARKING GUIDE / mark scheme for the provided exam: model answers, marks per question and notes on awarding partial credit. Match the exact numbering. Markdown.`,
};

const TITLES: Record<string, string> = {
  reader: "Reader", textbook: "Textbook", "student-book": "Student Book", workbook: "Workbook",
  "activity-book": "Activity Book", revision: "Revision Book", "exam-prep": "Exam Prep", "homework-pack": "Homework Pack",
  "teacher-guide": "Teacher Guide", "lesson-notes": "Lesson Notes", "lesson-plan": "Lesson Plan", "weekly-plan": "Weekly Plan",
  "scheme-of-work": "Scheme of Work", "learning-objectives": "Learning Objectives", worksheet: "Worksheet",
  quiz: "Quiz", exam: "Exam", assessment: "Assessment", "answer-key": "Answer Key", "marking-guide": "Marking Guide",
};

const NEEDS_SOURCE = new Set(["answer-key", "marking-guide"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userId = getUserId(req);
    const b = await req.json();
    const docType = String(b.docType ?? "reader");
    const grade = String(b.grade ?? "").slice(0, 60);
    const subject = String(b.subject ?? "").slice(0, 80);
    const topic = String(b.topic ?? "").slice(0, 200);
    const country = String(b.country ?? "").slice(0, 80);
    const term = String(b.term ?? "").slice(0, 40);
    const year = String(b.year ?? "").slice(0, 40);
    const language = String(b.language ?? "").slice(0, 40);
    const exerciseTypes = Array.isArray(b.exerciseTypes) ? b.exerciseTypes.slice(0, 12).map((x: unknown) => String(x).slice(0, 40)).join(", ") : "";
    const sourceContent = String(b.sourceContent ?? "").slice(0, 30000);

    if (!PROMPTS[docType]) {
      return new Response(JSON.stringify({ error: "Unknown document type." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!topic.trim() && !subject.trim()) {
      return new Response(JSON.stringify({ error: "A subject or topic is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (NEEDS_SOURCE.has(docType) && !sourceContent.trim()) {
      return new Response(JSON.stringify({ error: "This document needs the source paper to mark against." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = [
      grade && `- Grade / level: ${grade}`,
      subject && `- Subject: ${subject}`,
      (topic || subject) && `- Topic: ${topic || subject}`,
      country && `- Curriculum context: ${country}`,
      term && `- Term: ${term}`,
      year && `- Academic year: ${year}`,
      language && `- Language of instruction: ${language}`,
      exerciseTypes && `- Preferred exercise types: ${exerciseTypes}`,
    ].filter(Boolean).join("\n");

    const system = knowledgeBlock(b.knowledge) + `You are an experienced curriculum writer and teacher creating accurate, classroom-ready materials.

${PROMPTS[docType]}

CONTEXT:
${ctx}

RULES:
- Pedagogically sound, factually accurate, and pitched correctly for the grade.
- ${language && language.toLowerCase() !== "english" ? `Write the document in ${language}.` : "Write in clear English."}
- Start the document with a clear "# " title line.
- Output ONLY the document in clean markdown — no meta-commentary.`;

    const user = NEEDS_SOURCE.has(docType)
      ? `Here is the paper to mark against. Produce the matching ${TITLES[docType]}.\n\n${sourceContent}`
      : `Create the ${TITLES[docType]} for: ${subject} — ${topic} (${grade}).`;

    await requirePlanOrThrow(userId, "professional");
    await consumeOrThrow(userId);
    const content = await complete({ system, user, maxTokens: 8000 });

    return new Response(JSON.stringify({ content, docType, title: TITLES[docType] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-school-content error:", e);
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
