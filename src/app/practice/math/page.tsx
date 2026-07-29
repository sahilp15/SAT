import { PracticeSetup } from "@/components/practice/PracticeSetup";
import { MATH_TAXONOMY } from "@/lib/taxonomy";
import { ArrowLink, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function MathPracticePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Practice"
        title="Math"
        description="A Desmos calculator is available on every question, exactly as on the digital test. Every miss opens an error log before you can move on."
        actions={<ArrowLink href="/practice/regression">Regression trainer</ArrowLink>}
      />
      <PracticeSetup section="MATH" taxonomy={MATH_TAXONOMY} />
    </div>
  );
}
