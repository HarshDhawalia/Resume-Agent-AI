# Option 2: AI Resume Tailoring Agent

An end-to-end Node.js pipeline that reads a candidate's resume and 5 job descriptions, uses the **Gemini API** to tailor the resume for each role, saves each version as a `.docx` file, and emails it via Gmail.

---

## Why I chose this option

Option 2 is better suited to demonstrating AI pipeline skills (prompt engineering, LLM integration, structured output) without the unpredictability of browser automation against live websites. The inputs are controlled, the libraries are stable, and the quality bar — making each resume meaningfully different — is a real engineering challenge.

---

## Tech stack

| Concern | Library |
|---|---|
| Excel parsing | `exceljs` |
| `.docx` reading | `mammoth` |
| `.docx` writing | `docx` |
| LLM tailoring | `@google/generative-ai` (Gemini 1.5 Flash) |
| Email delivery | `nodemailer` + Gmail SMTP |

---

## Setup

### Prerequisites
- Node.js 18+
- A free [Google AI Studio](https://aistudio.google.com/app/apikey) account (Gemini API key)
- A Gmail account with [2-Step Verification](https://myaccount.google.com/security) enabled

### 1. Clone and install

```bash
git clone <your-repo-url>
cd option2-resume-agent
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

- `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `GMAIL_USER` — your Gmail address
- `GMAIL_APP_PASSWORD` — a Gmail App Password (not your login password):
    1. Go to Google Account → Security → 2-Step Verification → App passwords
    2. Create one for "Mail" + "Windows Computer" (or any device)
    3. Copy the 16-character password into `.env`
- `RECIPIENT_EMAIL` — where emails should be sent (can be the same as `GMAIL_USER` for testing)

### 3. Add input files

Place the following in the `inputs/` folder:

```
inputs/
├── option2_job_links.xlsx   ← Excel file with # and URL columns
├── option2_jobs.json        ← JSON array with id, title, company, description
└── candidate_resume.docx    ← The candidate's base resume
```

### 4. Run

```bash
npm start
```

Tailored `.docx` files are saved to `outputs/`. One email per job is sent to `RECIPIENT_EMAIL`.

---

## Approach and key decisions

### Prompt engineering
The core quality challenge is making each of the 5 tailored resumes genuinely different. The prompt in `src/gemini.js` instructs the model to:
- Rewrite the summary to directly name the role and key skills
- Reorder skills so the most relevant appear first
- Rephrase experience bullets using keywords from the job description
- Adjust section order based on whether the role is technical vs. leadership-focused
- Match the tone to the job description style (startup vs. enterprise)

### Error handling
Every step that can fail — LLM call, file write, email send — is wrapped in its own `try/catch`. A failure at any step logs the error and skips to the next job. The pipeline never crashes on a single failure, and the final summary clearly lists what succeeded and what didn't.

### Module structure
- `parser.js` — all file I/O (Excel, JSON, docx reading)
- `gemini.js` — all LLM interaction and prompt construction
- `docWriter.js` — all `.docx` generation and formatting
- `mailer.js` — all email logic
- `main.js` — orchestration only; no business logic

---

## Assumptions

- The evaluator has a Gmail account and can generate a Gmail App Password
- `option2_job_links.xlsx` has a column named `#` and a column named `URL`
- `option2_jobs.json` is a JSON array where each object has `id`, `title`, `company`, and `description` fields
- The `#` column in Excel matches the `id` field in JSON

---

## What I would improve given more time

- **PDF output**: Add a LibreOffice headless conversion step to also produce a `.pdf` version alongside the `.docx`
- **Retry logic**: Add exponential backoff for Gemini API rate limits
- **Diff report**: Generate a short summary of what changed between the base and tailored resume for each job
- **Better formatting**: Parse the original `.docx` styles and attempt to preserve them in the output
- **Parallel processing**: Run Gemini calls concurrently with `Promise.allSettled` for speed

---

## Demo video

[Link to video — add before submission]