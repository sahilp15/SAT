import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bluebook-inspired testing palette. A true, slightly-cool exam blue as
        // the accent, warm-neutral slate for chrome, and dedicated semantic hues.
        brand: {
          50: "#eef3ff",
          100: "#dbe6ff",
          200: "#bcd0ff",
          300: "#8fb0ff",
          400: "#5f88f7",
          500: "#3b66ec",
          600: "#274bd6",
          700: "#1f3bb0",
          800: "#1e3389",
          900: "#1d2f6d",
        },
        ink: {
          DEFAULT: "#1b2130",
          soft: "#3d4557",
          faint: "#6b7488",
        },
        // Text-annotation colors (highlight/underline), mirroring the test UI.
        highlight: "#ffe37a",
        annotate: "#f6b73c",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Charter", "Georgia", "Cambria", "Times New Roman", "serif"],
        math: ["KaTeX_Main", "Cambria Math", "STIX Two Math", "Cambria", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.05), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        panel: "0 10px 30px -10px rgb(16 24 40 / 0.22), 0 4px 12px -4px rgb(16 24 40 / 0.12)",
        pop: "0 6px 20px -6px rgb(16 24 40 / 0.28)",
      },
      borderRadius: {
        xl: "0.9rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(3px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "slide-in": "slide-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
