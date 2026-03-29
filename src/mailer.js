import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

let transporter;

function getTransporter() {
    if (!transporter) {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env");
        }
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
    }
    return transporter;
}

/**
 * Sends a single email with the tailored resume attached.
 */
export async function sendResumeEmail(job, resumeFilePath) {
    const transport = getTransporter();

    const recipient = process.env.RECIPIENT_EMAIL || process.env.GMAIL_USER;
    const filename = path.basename(resumeFilePath);

    const emailBody = `
Hi,

Please find attached a tailored resume for the following position:

  Role:    ${job.title}
  Company: ${job.company}
  Link:    ${job.url}

This resume has been customized to highlight the most relevant experience and skills for this specific role.

Best regards,
Resume Agent
`.trim();

    const mailOptions = {
        from: `"Resume Agent" <${process.env.GMAIL_USER}>`,
        to: recipient,
        subject: `Tailored Resume: ${job.title} at ${job.company}`,
        text: emailBody,
        attachments: [
            {
                filename,
                content: fs.readFileSync(resumeFilePath),
                contentType:
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
        ],
    };

    await transport.sendMail(mailOptions);
    console.log(`[mailer] Email sent for "${job.title}" at ${job.company} → ${recipient}`);
}