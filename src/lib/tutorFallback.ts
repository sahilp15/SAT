// Offline tutor replies.
//
// The tutor must still be worth opening when there is no API key, when the
// daily budget is spent, or when OpenAI is down. These replies are built purely
// from local data — the official explanation, the student's mastery table, and
// today's plan — and they say plainly that AI is off rather than pretending.

import type { TutorMode, TutorProfile, TutorQuestionContext } from "./ai/prompts";
import type { AiFailureReason } from "./ai/client";
import type { AiTutorReply } from "./ai/schemas";

const REASON_NOTE: Record<AiFailureReason, string> = {
  NOT_CONFIGURED: "AI coaching is off — add an `OPENAI_API_KEY` to your `.env` to turn it on.",
  RATE_LIMITED: "AI coaching is rate-limited right now; try again in a minute.",
  TIMEOUT: "The AI request timed out, so here's what your own data says.",
  INVALID_RESPONSE: "The AI response came back malformed, so here's what your own data says.",
  BUDGET_EXCEEDED: "Today's AI request budget is spent. Everything else still works.",
  API_ERROR: "The AI service is unavailable right now, so here's what your own data says.",
};

function header(reason?: AiFailureReason): string {
  return REASON_NOTE[reason ?? "NOT_CONFIGURED"];
}

export function offlineTutorReply(
  mode: TutorMode,
  profile: TutorProfile,
  question: TutorQuestionContext | null,
  reason?: AiFailureReason
): AiTutorReply {
  const note = header(reason);
  const weakest = profile.weakestSkills[0];

  switch (mode) {
    case "HINT":
      return {
        reply: question
          ? `${note}\n\nWithout AI I won't invent a hint, but here's a reliable next step for a ${question.difficulty.toLowerCase()} ${question.skill} question: restate exactly what the question is asking in your own words, then find the single piece of information in the text or setup that the answer must depend on. Rule out any choice that ignores it.`
          : `${note}\n\nOpen a specific question and I can point you at the right next step.`,
        generatedQuestion: null,
        followUps: ["Explain my mistake", "Teach me this concept"],
      };

    case "EXPLAIN_MISTAKE":
      return {
        reply: question
          ? `${note}\n\nHere is the official explanation for this question, which is the authoritative source:\n\n${
              question.officialExplanation ?? "No explanation is stored for this question."
            }\n\nYou chose ${question.chosenAnswer ?? "(nothing)"}; the correct answer is ${question.correctAnswer}. Write down, in one sentence, the specific step where your reasoning diverged from the explanation above — that sentence is the thing worth remembering.`
          : `${note}\n\nOpen this from a specific question in your error log and I'll show you its official explanation.`,
        generatedQuestion: null,
        followUps: ["Practice this skill", "Review my error log"],
      };

    case "TEACH":
      return {
        reply: question
          ? `${note}\n\nThis question tests **${question.skill}** (${question.domain}). The stored explanation walks the full method:\n\n${
              question.officialExplanation ?? "No explanation is stored for this question."
            }`
          : `${note}\n\nPick a question or a weak skill and I'll pull up its stored explanation. Right now your lowest-mastery skill is ${
              weakest ? `**${weakest.skill}** (${Math.round(weakest.mastery * 100)}%)` : "not yet determined — take the score predictor first"
            }.`,
        generatedQuestion: null,
        followUps: ["Quiz me on my weakest skill", "Plan my day"],
      };

    case "SIMILAR":
      return {
        reply: `${note}\n\nI won't fabricate a question without the model — a badly-formed item is worse than none. Instead, start a practice set on ${
          question ? `**${question.skill}**` : weakest ? `**${weakest.skill}**` : "your weakest skill"
        } from the Practice page; those are real, validated items from your bank.`,
        generatedQuestion: null,
        followUps: ["Open practice", "Review my error log"],
      };

    case "CHECK":
      return {
        reply: `${note}\n\nCheck your own reasoning against the stored explanation: read it one step at a time and stop at the first line you couldn't have written yourself. That line is the gap.${
          question?.officialExplanation ? `\n\n${question.officialExplanation}` : ""
        }`,
        generatedQuestion: null,
        followUps: ["Explain my mistake"],
      };

    case "QUIZ":
      return {
        reply: `${note}\n\nUse the Practice page for a real quiz — it pulls validated questions and records the results into your mastery model, which a chat quiz can't do. ${
          weakest
            ? `Start with **${weakest.skill}** (${Math.round(weakest.mastery * 100)}% mastery).`
            : "Take the score predictor first so it knows what to quiz you on."
        }`,
        generatedQuestion: null,
        followUps: ["Open practice", "See my recommendations"],
      };

    case "PLAN":
    default: {
      const days = profile.daysUntilTest;
      const lines = [
        note,
        "",
        "Here's today from your own data:",
        profile.todayPlan
          ? `- Scheduled: ${profile.todayPlan}`
          : "- Nothing scheduled — generate a plan from the Study Plan page.",
        weakest
          ? `- Highest-priority gap: ${weakest.skill} (${Math.round(weakest.mastery * 100)}% mastery, ${weakest.signal.toLowerCase().replace(/_/g, " ")})`
          : "- No mastery data yet — take the score predictor.",
        profile.minutesPerDay
          ? `- You have about ${profile.minutesPerDay} minutes: spend roughly two-thirds on the gap above and the rest clearing due reviews.`
          : "- Set your available study time in Profile so the plan can size sessions.",
        days != null ? `- ${days} day${days === 1 ? "" : "s"} until test day.` : "",
      ].filter(Boolean);
      return {
        reply: lines.join("\n"),
        generatedQuestion: null,
        followUps: ["Open today's plan", "See my recommendations"],
      };
    }
  }
}
