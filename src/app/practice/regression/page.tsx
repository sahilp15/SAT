import { PracticeRunner } from "@/components/practice/PracticeRunner";
import { Card, CardHeader, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

// Focused practice on SAT-style regression/scatterplot questions. The workflow
// it reinforces: enter the data as a Desmos table, fit a model with "~", then
// read the parameters back out.
export default function RegressionPracticePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Math"
        title="Regression trainer"
        description="Build speed reading scatterplots and fitting models in Desmos — a high-value, very learnable Math skill."
      />

      <Card className="border-accent bg-accent-weak">
        <CardHeader title="Fitting a regression in Desmos" eyebrow="The workflow" />
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[0.8125rem] leading-relaxed text-ink-2">
          <li>
            Enter the data as a table: type <code className="font-mono">x1</code> and{" "}
            <code className="font-mono">y1</code> as column headers, then the values.
          </li>
          <li>
            Add a model with the tilde — <code className="font-mono">y1 ~ m x1 + b</code> for
            linear, <code className="font-mono">y1 ~ a x1^2 + b x1 + c</code> for quadratic,{" "}
            <code className="font-mono">y1 ~ a b^{`{x1}`}</code> for exponential.
          </li>
          <li>Read the fitted parameters Desmos reports and answer from those.</li>
          <li>
            Interpret carefully: the slope or base is a <em>rate</em>; the intercept is the value
            at <code className="font-mono">x = 0</code>.
          </li>
        </ol>
      </Card>

      <PracticeRunner
        config={{ section: "MATH", mode: "practice", regression: true }}
        title="Regression practice"
      />
    </div>
  );
}
