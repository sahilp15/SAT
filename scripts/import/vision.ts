// Vision transcription: send a rendered PDF page image to an OpenAI vision model
// and get back clean, structured questions with LaTeX math.
//
// The key is read from OPENAI_API_KEY (server/CLI only — never shipped to the
// browser). Set VISION_MOCK=1 to bypass the API and return canned data, which is
// how the pipeline is tested without a key or network.

import OpenAI from "openai";
import { visionPageSchema, type VisionQuestion } from "./visionSchema";

const SYSTEM_PROMPT = `You transcribe pages from the official SAT Suite Question Bank into clean, structured data for a study app. Accuracy and faithfulness are critical.

Rules:
- Extract EVERY question on the page. A page may contain 0, 1, or more questions.
- Preserve the EXACT wording of the stem, every answer choice, the correct answer, and the official rationale/explanation. Do not paraphrase or invent content.
- Render ALL mathematics as LaTeX: inline as $...$ and display as $$...$$. Use \\frac for fractions, ^ for exponents, \\sqrt for roots, \\le/\\ge for inequalities, and \\begin{cases}...\\end{cases} for systems. Never leave math as broken or plain text.
- Data tables: reproduce them as GitHub-style markdown pipe tables inside the "stimulus".
- Figures/graphs/diagrams/scatterplots/number lines: you cannot reproduce the image, so add a short description in the "stimulus" prefixed with "[Figure: ...]" and set "hasFigure": true.
- Classify using the labels printed on the page: "Domain", "Skill", and "Question Difficulty" (map to EASY/MEDIUM/HARD).
- "format": "MCQ" if it has lettered choices A-D; "SPR" (student-produced response) if it asks for a typed-in numeric answer (no choices).
- For MCQ, mark exactly one choice isCorrect: true (match the page's "Correct Answer"). For each incorrect choice, include its "rationaleWrong" if the rationale explains it.
- "correctAnswer": the letter (A-D) for MCQ, or the literal accepted value(s) for SPR (comma-separate multiple accepted forms, e.g. "1.5, 3/2").
- "externalId": the page's "Question ID" hex string if visible; otherwise null.
- "isRegression": true if the item involves scatterplots, line/curve of best fit, correlation, or regression models.
- "isBluebook": true ONLY if the page indicates the item is from an official Bluebook or full practice test (these are reserved as diagnostics).
- "needsReview": true if you had to guess at anything unreadable.

Respond with STRICT JSON only, in this exact shape:
{"questions":[{"externalId":string|null,"section":"MATH"|"READING_WRITING","domain":string,"skill":string,"difficulty":"EASY"|"MEDIUM"|"HARD","format":"MCQ"|"SPR","stimulus":string|null,"stem":string,"choices":[{"label":string,"content":string,"isCorrect":boolean,"rationaleWrong":string|null}],"correctAnswer":string,"explanation":string|null,"isRegression":boolean,"isBluebook":boolean,"hasFigure":boolean,"needsReview":boolean}]}`;

function mockTranscription(): VisionQuestion[] {
  // Deterministic sample used by VISION_MOCK for pipeline testing (no API call).
  return visionPageSchema.parse({
    questions: [
      {
        externalId: "mock-vision-0001",
        section: "MATH",
        domain: "Algebra",
        skill: "Linear equations in one variable",
        difficulty: "EASY",
        format: "MCQ",
        stem: "If $5x - 4 = 21$, what is the value of $x$?",
        choices: [
          { label: "A", content: "$3$", isCorrect: false, rationaleWrong: "This solves $5x=15$." },
          { label: "B", content: "$5$", isCorrect: true },
          { label: "C", content: "$\\dfrac{17}{5}$", isCorrect: false, rationaleWrong: "This forgets to add 4." },
          { label: "D", content: "$25$", isCorrect: false, rationaleWrong: "This multiplies instead of dividing." },
        ],
        correctAnswer: "B",
        explanation: "Add 4 to both sides: $5x = 25$. Divide by 5: $x = 5$.",
        isRegression: false,
        isBluebook: false,
        hasFigure: false,
        needsReview: false,
      },
    ],
  }).questions;
}

export async function transcribePage(
  png: Buffer,
  opts: { model?: string } = {}
): Promise<VisionQuestion[]> {
  if (process.env.VISION_MOCK === "1") {
    return mockTranscription();
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your .env (or run with VISION_MOCK=1 to test the pipeline without a key)."
    );
  }

  const client = new OpenAI({ apiKey });
  const model = opts.model || process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;

  const res = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe all SAT questions on this page as JSON." },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        ],
      },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  const parsed = visionPageSchema.parse(JSON.parse(raw));
  return parsed.questions;
}
