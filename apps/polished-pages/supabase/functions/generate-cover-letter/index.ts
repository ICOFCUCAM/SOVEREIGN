import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, phone, jobDescription, relevantExperience, tone } = await req.json();

    const toneGuide = {
      professional: "Maintain a formal, corporate tone throughout.",
      friendly: "Use a warm, approachable yet professional tone.",
      confident: "Use a bold, assertive tone that conveys strong leadership and competence.",
    }[tone || "professional"] || "Maintain a formal, corporate tone throughout.";

    const systemPrompt = `You are an elite cover letter writer. Generate a polished, tailored cover letter in clean markdown format.

RULES:
- Address the specific job requirements mentioned in the job description
- Mirror the language and keywords from the job posting
- Connect the candidate's experience directly to the role's needs
- Keep it to 3-4 paragraphs maximum
- ${toneGuide}
- Open with a compelling hook, NOT "I am writing to apply..."
- Close with a confident call to action
- Do NOT include any instructions or meta-commentary, ONLY the letter content
- Use markdown formatting: # for the header, then flowing paragraphs
- Include a proper greeting and sign-off`;

    const userPrompt = `Generate a tailored cover letter with the following details:

**Applicant:**
Name: ${fullName}
Email: ${email}
Phone: ${phone || "Not provided"}

**Job Description:**
${jobDescription}

**Relevant Experience & Achievements:**
${relevantExperience || "Not provided — infer from the job description what strengths to highlight."}`;

    const coverLetter = await complete({ system: systemPrompt, user: userPrompt, maxTokens: 4000 });

    return new Response(JSON.stringify({ coverLetter }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cover-letter error:", e);
    const status = e instanceof LlmError && e.status ? e.status : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
