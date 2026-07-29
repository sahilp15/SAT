import { PracticeSetup } from "@/components/practice/PracticeSetup";
import { RW_TAXONOMY } from "@/lib/taxonomy";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ReadingWritingPracticePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Practice"
        title="Reading &amp; Writing"
        description="Drag to highlight or underline any passage, as you can in Bluebook. Every miss opens an error log before you can move on."
      />
      <PracticeSetup section="READING_WRITING" taxonomy={RW_TAXONOMY} />
    </div>
  );
}
