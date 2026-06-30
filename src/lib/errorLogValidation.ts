import { z } from "zod";
import { isMistakeType } from "./taxonomy";

// Minimum-effort gate: even without AI, a reflection must actually be filled in.
// These minimums block one-word, lazy logs while staying lenient enough not to
// nag a genuine short answer.
const reflectionText = (min: number) =>
  z.string().trim().min(min, `Please write at least ${min} characters.`);

export const errorLogSchema = z.object({
  attemptId: z.string(),
  whyChose: reflectionText(15),
  whyWrong: reflectionText(15),
  whyCorrectRight: reflectionText(15),
  mistakeType: z.string().refine(isMistakeType, "Pick a mistake type."),
  whatDifferent: reflectionText(15),
  confidenceAfter: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export type ErrorLogInput = z.infer<typeof errorLogSchema>;
