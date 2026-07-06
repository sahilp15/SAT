// App-wide legal/attribution footer. The SAT question content used in this app
// may come from official College Board materials imported for private study.

export function Footer() {
  return (
    <footer className="mt-10 border-t" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--surface) 60%, transparent)" }}>
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed sm:px-6 lg:px-8" style={{ color: "var(--ink-faint)" }}>
        <p>
          <strong>Disclaimer:</strong> SAT&reg; is a trademark registered by the College Board.
          Official SAT / College Board questions and materials used in this app are the property of
          the College Board and are used here <strong>solely for personal, private study and
          practice</strong>. This project is an independent study tool and is{" "}
          <strong>not affiliated with, authorized, sponsored, or endorsed by the College Board</strong>.
          Content is stored locally and is not redistributed.
        </p>
      </div>
    </footer>
  );
}
