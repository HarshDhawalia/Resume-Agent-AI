import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI;

function getClient() {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

/**
 * Builds a detailed prompt that instructs Gemini to produce a meaningfully
 * tailored resume — not just a light reword.
 */
function buildPrompt(resumeText, job) {
    return `
You are an expert resume writer. Your task is to tailor the candidate's resume specifically for the job below.

== JOB DETAILS ==
Title: ${job.title}
Company: ${job.company}
URL: ${job.url}

Job Description:
${job.description}

== CANDIDATE'S BASE RESUME ==
${resumeText}

== TAILORING INSTRUCTIONS ==
Rewrite the resume so it is a strong match for this specific role. Follow these rules strictly:

1. SUMMARY: Rewrite the professional summary (2-3 sentences) to directly address the role's core requirements. Mention the job title and at least two key skills from the job description.

2. SKILLS: Reorder and prioritize the skills section so the most relevant skills appear first. Add any relevant skills implied by the job description that the candidate plausibly has. Remove or de-emphasize unrelated skills.

3. EXPERIENCE: For each past role, rewrite bullet points to emphasize achievements and responsibilities that map to this job description. Use language and keywords from the job description. Quantify where possible.

4. SECTION ORDER: If the job is technical (engineering, data, etc.), put Skills before Experience. If the job is leadership or business-focused, put Experience first.

5. TONE: Match the tone of the job description. Startups want concise and bold; enterprises want measured and precise.

6. Do NOT invent credentials, degrees, or companies the candidate did not have. You may rephrase and reframe existing experience.

7. Output ONLY the final resume text — no preamble, no explanation, no markdown fences. Use plain text with clear section headers in ALL CAPS (e.g. SUMMARY, SKILLS, EXPERIENCE, EDUCATION).

Produce the tailored resume now:
`.trim();
}

/**
 * Calls Gemini to tailor the resume for a given job.
 * Returns the tailored resume as a plain text string.
 */
export async function tailorResume(resumeText, job) {
    const client = getClient();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = buildPrompt(resumeText, job);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length < 100) {
        throw new Error(`Gemini returned unexpectedly short output for job id=${job.id}`);
    }

    return text.trim();
}