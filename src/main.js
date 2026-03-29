import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { loadJobs, extractResumeText } from "./parser.js";
import { tailorResume } from "./gemini.js";
import { saveResumeDocx } from "./docWriter.js";
import { sendResumeEmail } from "./mailer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const EXCEL_PATH  = path.join(ROOT, "inputs", "option2_job_links.xlsx");
const JSON_PATH   = path.join(ROOT, "inputs", "option2_jobs.json");
const RESUME_PATH = path.join(ROOT, "inputs", "candidate_resume.docx");
const OUTPUT_DIR  = path.join(ROOT, "outputs");

async function main() {
    console.log("=== Resume Tailoring Agent ===\n");

    // --- Step 1: Load and join data ---
    console.log("[main] Loading jobs and resume...");
    let jobs;
    try {
        jobs = await loadJobs(EXCEL_PATH, JSON_PATH);
    } catch (err) {
        console.error("[main] FATAL: Could not load jobs:", err.message);
        process.exit(1);
    }

    let baseResume;
    try {
        baseResume = await extractResumeText(RESUME_PATH);
    } catch (err) {
        console.error("[main] FATAL: Could not read resume:", err.message);
        process.exit(1);
    }

    console.log(`[main] Loaded ${jobs.length} jobs. Starting pipeline...\n`);

    const results = { success: [], failed: [] };

    // --- Step 2: Process each job ---
    for (const job of jobs) {
        console.log(`--- Processing job ${job.id}: "${job.title}" at ${job.company} ---`);

        // 2a. Tailor resume via Gemini
        let tailoredText;
        try {
            console.log(`[main] Calling Gemini for job ${job.id}...`);
            tailoredText = await tailorResume(baseResume, job);
            console.log(`[main] Gemini tailoring complete for job ${job.id}.`);
        } catch (err) {
            console.error(`[main] ERROR: Gemini failed for job ${job.id}:`, err.message);
            results.failed.push({ job, stage: "gemini", error: err.message });
            continue; // move to next job
        }

        // 2b. Save as .docx
        let resumePath;
        try {
            resumePath = await saveResumeDocx(tailoredText, job, OUTPUT_DIR);
        } catch (err) {
            console.error(`[main] ERROR: Could not save docx for job ${job.id}:`, err.message);
            results.failed.push({ job, stage: "docWriter", error: err.message });
            continue;
        }

        // 2c. Send email
        try {
            await sendResumeEmail(job, resumePath);
        } catch (err) {
            console.error(`[main] ERROR: Email failed for job ${job.id}:`, err.message);
            results.failed.push({ job, stage: "mailer", error: err.message });
            // Still count as partial success since file was saved
            results.success.push({ job, resumePath, emailSent: false });
            continue;
        }

        results.success.push({ job, resumePath, emailSent: true });
        console.log(`[main] Job ${job.id} complete.\n`);
    }

    // --- Step 3: Summary ---
    console.log("\n=== PIPELINE SUMMARY ===");
    console.log(`Successful: ${results.success.length} / ${jobs.length}`);

    if (results.success.length > 0) {
        console.log("\nCompleted jobs:");
        results.success.forEach(({ job, resumePath, emailSent }) => {
            const emailStatus = emailSent ? "email sent" : "email FAILED (file saved)";
            console.log(`  [${job.id}] ${job.title} @ ${job.company} — ${emailStatus}`);
            console.log(`        File: ${resumePath}`);
        });
    }

    if (results.failed.length > 0) {
        console.log(`\nFailed jobs (${results.failed.length}):`);
        results.failed.forEach(({ job, stage, error }) => {
            console.log(`  [${job.id}] ${job.title} @ ${job.company} — failed at ${stage}: ${error}`);
        });
    }

    console.log("\nDone.");
}

main().catch((err) => {
    console.error("[main] Unhandled error:", err);
    process.exit(1);
});