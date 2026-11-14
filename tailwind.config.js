/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        bg2: "var(--bg-2)",
        bg3: "var(--bg-3)",
        ink: "var(--ink)",
        inkDim: "var(--ink-dim)",
        inkFaint: "var(--ink-faint)",
        line: "var(--line)",
        line2: "var(--line-2)",
        dot: "var(--dot)",
        accent: "var(--accent)",
        accent2: "var(--accent-2)",
        ok: "var(--ok)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
