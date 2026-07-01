import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SAT Prep — Personal Study System",
  description:
    "A private, local-first SAT prep app: personalized practice, forced error logs, spaced repetition, and progress tracking for Reading & Writing and Math.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <AppNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
