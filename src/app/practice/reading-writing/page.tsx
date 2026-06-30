import { PracticeLauncher } from "@/components/PracticeLauncher";
import { RW_TAXONOMY } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default function ReadingWritingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reading & Writing</h1>
        <p className="mt-1 text-slate-500">
          Practice passages and questions. Every miss requires an error log before you move on.
        </p>
      </div>
      <PracticeLauncher section="READING_WRITING" taxonomy={RW_TAXONOMY} />
    </div>
  );
}
