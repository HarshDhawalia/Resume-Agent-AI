import ExcelJS from "exceljs";
import mammoth from "mammoth";
import fs from "fs";
import path from "path";

/**
 * Reads option2_job_links.xlsx and returns rows as objects.
 * Joins with option2_jobs.json on the `#` / `id` field.
 */
export async function loadJobs(excelPath, jsonPath) {
    // --- Read Excel ---
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    const sheet = workbook.worksheets[0];

    const headers = [];
    const excelRows = [];

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            row.eachCell((cell) => headers.push(String(cell.value).trim()));
        } else {
            const obj = {};
            row.eachCell((cell, colNumber) => {
                obj[headers[colNumber - 1]] = cell.value;
            });
            excelRows.push(obj);
        }
    });

    // --- Read JSON ---
    const rawJson = fs.readFileSync(jsonPath, "utf-8");
    const parsed = JSON.parse(rawJson);
    const jsonJobs = Array.isArray(parsed) ? parsed : parsed.jobs || parsed;

    // --- Join on # (Excel) == id (JSON) ---
    const joined = excelRows.map((row) => {
        const idKey = Object.keys(row).find((k) => k.trim() === "#");
        const rowId = String(row[idKey]).trim();
        const jsonMatch = jsonJobs.find((j) => String(j.id).trim() === rowId);

        if (!jsonMatch) {
            console.warn(`[parser] No JSON match for Excel row id="${rowId}" — skipping.`);
            return null;
        }

        return {
            id: rowId,
            url: row["URL"] || row["url"] || jsonMatch.url || "",
            title: jsonMatch.title || "",
            company: jsonMatch.company || "",
            description: jsonMatch.description || "",
        };
    });

    return joined.filter(Boolean);
}

/**
 * Extracts plain text from a .docx file using mammoth.
 */
export async function extractResumeText(docxPath) {
    const result = await mammoth.extractRawText({ path: docxPath });
    if (result.messages.length > 0) {
        result.messages.forEach((m) => console.warn("[parser] mammoth:", m.message));
    }
    return result.value.trim();
}