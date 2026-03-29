import { GoogleGenerativeAI } from "@google/generative-ai";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
This resume must look DISTINCTLY different from a resume tailored for any other role. Follow these rules strictly:

1. SUMMARY: Rewrite the professional summary (2-3 sentences) to directly mention the job title "${job.title}" and use at least 3 specific keywords from the job description above. Do not use generic language.

2. SKILLS: Completely reorder the skills section. The top 3 skills must be the most critical ones mentioned in this specific job description. Remove or move to the bottom any skills not relevant to "${job.title}".

3. EXPERIENCE: For each past role, rewrite bullet points to emphasize achievements that directly map to THIS job's requirements. Use the exact terminology and keywords from the job description. Quantify achievements where possible.

4. SECTION ORDER:
   - If "${job.title}" is technical (engineer, developer, ML, DevOps): order is SUMMARY → SKILLS → EXPERIENCE → EDUCATION
   - If "${job.title}" is leadership or business focused: order is SUMMARY → EXPERIENCE → SKILLS → EDUCATION

5. TONE:
   - For backend/DevOps/ML roles: precise, technical, metric-driven
   - For frontend roles: creative, user-focused, collaborative
   - For full stack roles: versatile, fast-paced, ownership-focused

6. Do NOT invent credentials, degrees, or companies the candidate did not have.

7. Output ONLY the final resume text — no preamble, no explanation, no markdown fences. Use plain text with section headers in ALL CAPS (e.g. SUMMARY, SKILLS, EXPERIENCE, EDUCATION).

Produce the tailored resume for "${job.title}" at ${job.company} now:
`.trim();
}

export async function tailorResume(resumeText, job) {
    const client = getClient();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    await sleep(15000);

    const prompt = buildPrompt(resumeText, job);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length < 100) {
        throw new Error(`Gemini returned unexpectedly short output for job id=${job.id}`);
    }

    return text.trim();
}