import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { getLocalUser } from "@/lib/user";
import { getAppStatus } from "@/lib/status";

export const metadata: Metadata = {
  title: "SAT Studio — Personal Prep System",
  description:
    "A private, local-first SAT preparation system: adaptive score prediction, skill mastery tracking, an error log that resurfaces, and a plan built around your test date.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#101216" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applied before paint so the stored theme and sidebar state win with no flash
// of the wrong one. Kept tiny and dependency-free on purpose.
const BOOT_SCRIPT = `(function(){try{
var t=localStorage.getItem('sat-theme');
if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}
var r=localStorage.getItem('sat-rail');
document.documentElement.setAttribute('data-rail', r==='1'?'1':'0');
}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getLocalUser();
  const status = await getAppStatus(user.id);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <ToastProvider>
          <AppShell
            status={{
              daysRemaining: status.daysRemaining,
              testLabel: status.testLabel,
              streakDays: status.streakDays,
              dueCount: status.dueCount,
              predictedTotal: status.predictedTotal,
              targetScore: status.targetScore,
            }}
          >
            {children}
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
