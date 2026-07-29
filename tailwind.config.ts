import type { Config } from "tailwindcss";

// Every color is a CSS variable defined in src/app/globals.css, so `bg-surface`
// and `text-ink` automatically follow the light/dark token set instead of each
// component branching on theme.
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-2)",
          weak: "var(--accent-weak)",
          contrast: "var(--accent-contrast)",
        },
        gold: { DEFAULT: "var(--gold)", weak: "var(--gold-weak)" },
        good: { DEFAULT: "var(--good)", weak: "var(--good-weak)" },
        bad: { DEFAULT: "var(--bad)", weak: "var(--bad-weak)" },
        warn: { DEFAULT: "var(--warn)", weak: "var(--warn-weak)" },
      },
      fontFamily: {
        // Display: an editorial serif with real character. Offline-safe stack —
        // no webfont request, so the app still works with no network.
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        // Tabular data, timers, and score readouts.
        mono: ["var(--font-mono)"],
        // Long-form reading passages, mirroring the digital test.
        reading: ["var(--font-reading)"],
        math: ["KaTeX_Main", "Cambria Math", "STIX Two Math", "Cambria", "serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
        "2xl": "var(--r-2xl)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        pop: "var(--shadow-pop)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.24s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.16s ease-out both",
        "scale-in": "scale-in 0.16s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-up": "slide-up 0.24s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
