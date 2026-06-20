import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CV + Job-Description tailoring. Take an uploaded CV (raw text or already
// structured form data) plus a job posting, and return — in one metered call —
// a tailored CV, a matching cover letter, and an honest fit analysis. The model
// is held to strict integrity rules: it may rephrase and reprioritize genuine
// content but must never invent employers, titles, dates, or achievements.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = getUserId(req);
    const body = await req.json();

    const jobDescription: string = (body.jobDescription || "").toString();
    const cvText: string | undefined = body.cvText;
    const cvData = body.cvData;

    if (!jobDescription.trim() || jobDescription.length > 30000) {
      return new Response(JSON.stringify({ error: "A job description is required (max 30000 chars)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((!cvText || !cvText.trim()) && !cvData) {
      return new Response(JSON.stringify({ error: "Provide your current CV (cvText) or structured data (cvData)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (cvText && cvText.length > 50000) {
      return new Response(JSON.stringify({ error: "CV text is too long (max 50000 chars)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are an elite career strategist. You are given a candidate's EXISTING CV and a target JOB DESCRIPTION. Produce a version of the CV re-focused for that specific job, a matching cover letter, and an honest fit analysis.

ABSOLUTE INTEGRITY RULES — these are non-negotiable:
- NEVER invent employers, job titles, dates, degrees, certifications, metrics, or achievements that are not present in the candidate's CV.
- You MAY: rewrite the summary to target the role, reorder and rephrase existing bullet points to foreground job-relevant impact, surface skills the candidate genuinely lists or clearly demonstrates, and mirror the job posting's terminology WHERE the candidate truly has that experience.
- You MUST NOT add a skill, tool, or keyword to the CV that the candidate's source CV gives no genuine basis for. Instead, report it under "missingKeywords" in the analysis.
- The cover letter must only claim things supported by the candidate's real experience.

Return ONLY valid JSON (no markdown fences) with this EXACT shape:
{
  "tailored": {
    "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "", "summary": "" },
    "experiences": [{ "title": "", "company": "", "startDate": "", "endDate": "", "description": "newline-separated bullet points" }],
    "education": [{ "degree": "", "field": "", "institution": "", "year": "" }],
    "skills": "comma,separated",
    "certifications": "comma,separated",
    "languages": "English (Native), ...",
    "references": [{ "name": "", "title": "", "company": "", "email": "", "phone": "", "relationship": "" }]
  },
  "coverLetter": "markdown cover letter, 3-4 paragraphs, compelling hook, no 'I am writing to apply', confident close",
  "analysis": {
    "matchScore": 0,
    "matchedKeywords": ["keywords from the job the candidate genuinely meets"],
    "missingKeywords": ["important job keywords the candidate's CV does NOT support"],
    "summary": "2-3 sentence honest assessment of fit",
    "recommendations": ["concrete, truthful suggestions to strengthen the application"]
  }
}
matchScore is an integer 0-100 reflecting genuine alignment. Keep experience bullets achievement-led and quantified where the source provides numbers. Do not fabricate.`;

    const sourceCv = cvData
      ? `STRUCTURED CV DATA (JSON):\n${JSON.stringify(cvData)}`
      : `CV TEXT:\n${cvText}`;
    const user = `TARGET JOB DESCRIPTION:\n${jobDescription}\n\n———\n\nCANDIDATE'S EXISTING CV:\n${sourceCv}`;

    await consumeOrThrow(userId);
    const raw = await complete({ system, user, maxTokens: 8000 });

    let result;
    try {
      const content = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(content);
    } catch {
      throw new LlmError("Failed to parse the tailored result. Please try again.", 502);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tailor-cv error:", e);
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
