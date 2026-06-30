import Link from "next/link";
import { PracticeLauncher } from "@/components/PracticeLauncher";
import { MATH_TAXONOMY } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default function MathPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Math</h1>
        <p className="mt-1 text-slate-500">
          Choose a mode below — including Desmos-friendly, non-Desmos, and regression practice. A
          Desmos calculator is available on every math question.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Looking for focused regression drills?{" "}
          <Link href="/practice/regression" className="font-medium text-brand-600 hover:underline">
            Open the regression trainer →
          </Link>
        </p>
      </div>
      <PracticeLauncher section="MATH" taxonomy={MATH_TAXONOMY} />
    </div>
  );
}
