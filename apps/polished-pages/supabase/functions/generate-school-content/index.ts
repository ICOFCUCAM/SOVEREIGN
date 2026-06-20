import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// School-content engine. Generates ONE document at a time so a classroom pack
// (student book, workbook, teacher guide, quiz, answer key) is produced as a
// sequence of bounded calls. The answer key is generated against the actual
// workbook + quiz text (passed as sourceContent) so it always matches.
const PROMPTS: Record<string, string> = {
  reader: `Write an engaging EDUCATIONAL READER. Pitch the vocabulary and sentence length to the grade/age. Open with a hook, teach the topic through clear, friendly explanation and concrete examples (a short illustrative story or scenario is welcome), and finish with 3-5 simple review questions. Use markdown headings.`,
  "student-book": `Write a STUDENT BOOK / lesson for the topic. Clear learning objectives, structured explanation broken into short sections with subheadings, worked examples, key-term callouts, and a short summary. Age- and grade-appropriate. Markdown.`,
  workbook: `Create a STUDENT WORKBOOK of exercises for the topic (NO answers — student copy). Mix question types appropriate to the grade: fill-in-the-blank, short answer, matching, true/false, and a couple of applied problems. Number every question. Leave clear space cues for writing. Markdown.`,
  "teacher-guide": `Write a TEACHER GUIDE for the topic: lesson objectives, materials, a step-by-step lesson plan with timings, key talking points, common misconceptions to watch for, differentiation tips, and extension activities. Markdown.`,
  quiz: `Create a QUIZ on the topic (questions only — NO answers). 8-12 numbered questions of varied types appropriate to the grade, increasing in difficulty. Markdown.`,
  "answer-key": `Produce an ANSWER KEY (teacher copy) with the correct answer to EVERY numbered question in the provided workbook and quiz. Match the exact numbering. Add a brief note where a short explanation helps the teacher. Markdown.`,
};

const TITLES: Record<string, string> = {
  reader: "Reader", "student-book": "Student Book", workbook: "Workbook",
  "teacher-guide": "Teacher Guide", quiz: "Quiz", "answer-key": "Answer Key",
};

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
    if (docType === "answer-key" && !sourceContent.trim()) {
      return new Response(JSON.stringify({ error: "Answer key needs the workbook/quiz content." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are an experienced curriculum writer and teacher creating classroom-ready materials.

${PROMPTS[docType]}

CONTEXT:
- Grade / level: ${grade || "primary"}
- Subject: ${subject || "general"}
- Topic: ${topic || subject}
${country ? `- Curriculum context: ${country}` : ""}

RULES:
- Pedagogically sound, accurate, and pitched correctly for the grade.
- Start the document with a clear "# " title line.
- Output ONLY the document in clean markdown — no meta-commentary.`;

    const user = docType === "answer-key"
      ? `Here is the workbook and quiz to answer. Produce the matching answer key.\n\n${sourceContent}`
      : `Create the ${TITLES[docType]} for: ${subject} — ${topic} (${grade}).`;

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
