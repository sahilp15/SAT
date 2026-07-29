import { DiagnosticPlayer } from "@/components/diagnostic/DiagnosticPlayer";
import { getLocalUser } from "@/lib/user";
import { getActiveSession } from "@/lib/diagnostic/session";
import { FORM_COUNT, TOTAL_QUESTIONS } from "@/lib/diagnostic/form";
import { ButtonLink, Card, IconAlert } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Score Predictor — SAT Studio",
};

/** `?form=7` opens that specific diagnostic; anything else is ignored. */
function parseFormId(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n >= 1 && n <= FORM_COUNT ? n : null;
}

export default async function DiagnosticRunPage({
  searchParams,
}: {
  searchParams: { form?: string; replace?: string };
}) {
  const user = await getLocalUser();
  const requestedFormId = parseFormId(searchParams.form);
  const active = await getActiveSession(user.id);

  // Passing the id in avoids a start round-trip when a session already exists —
  // but only when it's the form being asked for.
  const resumable =
    active && (requestedFormId === null || active.formId === requestedFormId) ? active : null;

  // Switching forms discards the unfinished one, so ask rather than assume.
  if (active && !resumable && requestedFormId !== null && searchParams.replace !== "1") {
    const answered = active.responses.filter((r) => r.chosenAnswer).length;
    return (
      <div className="mx-auto max-w-lg py-16">
        <Card>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warn-weak text-warn">
            <IconAlert size={18} />
          </span>
          <h1 className="mt-4 text-xl text-ink">Diagnostic {active.formId} is unfinished</h1>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">
            You&apos;re {answered} of {TOTAL_QUESTIONS} questions into diagnostic {active.formId}.
            Starting diagnostic {requestedFormId} now discards that attempt — it won&apos;t be
            scored, and the questions you already answered stay unused.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <ButtonLink href={`/diagnostic/run?form=${active.formId}`} variant="primary">
              Finish diagnostic {active.formId}
            </ButtonLink>
            <ButtonLink href={`/diagnostic/run?form=${requestedFormId}&replace=1`}>
              Discard it and start {requestedFormId}
            </ButtonLink>
          </div>
          <p className="mt-4 text-[0.75rem] text-ink-3">
            Nothing already submitted is affected — past results and their breakdowns stay exactly
            as they are.
          </p>
        </Card>
      </div>
    );
  }

  return <DiagnosticPlayer sessionId={resumable?.id} formId={requestedFormId ?? undefined} />;
}
