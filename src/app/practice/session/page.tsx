import Link from "next/link";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { PageHeader } from "@/components/ui";
import { DIFFICULTIES } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

const SECTION_LABEL: Record<string, string> = {
  MATH: "Math",
  READING_WRITING: "Reading & Writing",
};

/** A fixed-length practice set, opened from a recommendation or the plan. */
export default function PracticeSessionPage({
  searchParams,
}: {
  searchParams: { section?: string; skill?: string; difficulty?: string; count?: string };
}) {
  const section =
    searchParams.section === "MATH" || searchParams.section === "READING_WRITING"
      ? searchParams.section
      : undefined;
  const skill = searchParams.skill?.slice(0, 160);
  const difficulty = (DIFFICULTIES as readonly string[]).includes(searchParams.difficulty ?? "")
    ? searchParams.difficulty
    : undefined;
  const parsedCount = Number.parseInt(searchParams.count ?? "", 10);
  const count = Number.isFinite(parsedCount) ? Math.min(40, Math.max(1, parsedCount)) : 10;

  const title = skill ?? (section ? `${SECTION_LABEL[section]} practice` : "Practice set");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        eyebrow={
          <>
            <Link href="/practice" className="hover:text-ink">
              Practice
            </Link>{" "}
            / focused set
          </>
        }
        title={title}
        description={[
          section ? SECTION_LABEL[section] : null,
          difficulty ? `${difficulty.toLowerCase()} difficulty` : "mixed difficulty",
          `${count} questions`,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <PracticeSession
        section={section}
        skill={skill}
        difficulty={difficulty}
        count={count}
        title={title}
      />
    </div>
  );
}
