import { QuestionRunner } from "@/components/QuestionRunner";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

// Regression trainer — focused practice on SAT-style regression/scatterplot
// questions, inspired by regressiontrainer.org. The workflow it reinforces:
// enter data in Desmos as a table, fit a model with the "~" syntax, then read
// the parameters to answer the question.
export default function RegressionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Regression Trainer</h1>
        <p className="mt-1 text-slate-500">
          Build speed reading scatterplots and fitting models in Desmos — a common high-value SAT
          Math skill.
        </p>
      </div>

      <Card style={{ background: "var(--accent-weak)" }}>
        <div className="font-semibold text-slate-800">How to fit a regression in Desmos</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>
            Enter the data as a table: type <code>x1</code> and <code>y1</code> column headers, then
            the values.
          </li>
          <li>
            Add a model with the tilde, e.g. <code>y1 ~ m x1 + b</code> (linear),{" "}
            <code>y1 ~ a x1^2 + b x1 + c</code> (quadratic), or <code>y1 ~ a b^{`{x1}`}</code>{" "}
            (exponential).
          </li>
          <li>Read the fitted parameters Desmos reports and use them to answer the question.</li>
          <li>
            Interpret: the slope/base is a <em>rate</em>; the intercept is the value at{" "}
            <code>x = 0</code>.
          </li>
        </ol>
      </Card>

      <QuestionRunner
        config={{ section: "MATH", mode: "practice", regression: true, showDesmos: true }}
      />
    </div>
  );
}
