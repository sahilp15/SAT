import { DiagnosticPlayer } from "@/components/diagnostic/DiagnosticPlayer";
import { getLocalUser } from "@/lib/user";
import { getActiveSession } from "@/lib/diagnostic/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Score Predictor — SAT Studio",
};

export default async function DiagnosticRunPage() {
  const user = await getLocalUser();
  const active = await getActiveSession(user.id);
  // Passing the id in avoids a start round-trip when a session already exists.
  return <DiagnosticPlayer sessionId={active?.id} />;
}
