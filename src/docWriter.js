import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
} from "docx";
import fs from "fs";
import path from "path";

/**
 * Converts a plain-text resume into a formatted .docx document.
 * Section headers (lines in ALL CAPS) get heading styling.
 * Other lines become body paragraphs.
 */
function buildDocument(tailoredText, job) {
    const lines = tailoredText.split("\n");
    const children = [];

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();

        if (line.trim() === "") {
            // Empty line → small spacer paragraph
            children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
            continue;
        }

        const isHeader =
            line.trim() === line.trim().toUpperCase() &&
            line.trim().length > 2 &&
            !/[a-z]/.test(line);

        if (isHeader) {
            children.push(
                new Paragraph({
                    text: line.trim(),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 240, after: 80 },
                    border: {
                        bottom: {
                            color: "4A86C8",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                    },
                })
            );
        } else if (line.trimStart().startsWith("•") || line.trimStart().startsWith("-")) {
            // Bullet point
            children.push(
                new Paragraph({
                    bullet: { level: 0 },
                    children: [
                        new TextRun({
                            text: line.replace(/^[\s•\-]+/, "").trim(),
                            size: 22,
                        }),
                    ],
                    spacing: { after: 60 },
                })
            );
        } else {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: line, size: 22 })],
                    spacing: { after: 60 },
                })
            );
        }
    }

    return new Document({
        styles: {
            default: {
                document: {
                    run: { font: "Calibri", size: 22 },
                },
            },
            paragraphStyles: [
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    run: {
                        font: "Calibri",
                        size: 26,
                        bold: true,
                        color: "1F3864",
                    },
                },
            ],
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 720, right: 900, bottom: 720, left: 900 },
                    },
                },
                children,
            },
        ],
    });
}

/**
 * Sanitizes a string for use in a filename.
 */
function toSlug(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 40);
}

/**
 * Saves the tailored resume as a .docx file.
 * Returns the absolute path to the saved file.
 */
export async function saveResumeDocx(tailoredText, job, outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });

    const slug = toSlug(`${job.title}_${job.company}`);
    const filename = `resume_${slug}_${job.id}.docx`;
    const filepath = path.join(outputDir, filename);

    const doc = buildDocument(tailoredText, job);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);

    console.log(`[docWriter] Saved: ${filename}`);
    return filepath;
}