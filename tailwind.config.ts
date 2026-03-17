import type { Config } from "tailwindcss";

const config: Config = {
  /*
    darkMode: "class" — we add .dark / .light to <html> manually
    via the inline script in layout.tsx so dark mode works without
    a flash on first load.
  */
  darkMode: "class",

  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      /* ── Font families ── */
      fontFamily: {
        serif:  ["var(--font-crimson)", "Crimson Pro", "Georgia", "serif"],
        arabic: ["var(--font-scheherazade)", "Scheherazade New", "Traditional Arabic", "serif"],
        mono:   ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },

      /* ── Colors ── */
      colors: {
        gold: {
          50:  "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#f0d060",   /* light gold  */
          500: "#d4af37",   /* primary gold */
          600: "#b8860b",   /* dark gold   */
          700: "#92690a",
          800: "#6b4f08",
          900: "#453306",
        },
      },

      /* ── Typography scale additions ── */
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],   /* 10px */
        "3xs": ["0.5rem",   { lineHeight: "0.75rem" }], /* 8px  */
      },

      /* ── Line heights ── */
      lineHeight: {
        arabic:  "2.2",
        relaxed: "1.75",
      },

      /* ── Border radii ── */
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },

      /* ── Box shadows ── */
      boxShadow: {
        "gold-sm": "0 0 0 1px rgba(212,175,55,0.2)",
        "gold-md": "0 0 12px 2px rgba(212,175,55,0.12)",
        "card":    "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      },

      /* ── Animation extras ── */
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateX(-50%) translateY(-10px)" },
          to:   { opacity: "1", transform: "translateX(-50%) translateY(0)"     },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        "check-pop": {
          "0%":   { transform: "scale(0.5)" },
          "55%":  { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)"   },
        },
        "glow-green": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0)" },
          "50%":       { boxShadow: "0 0 14px 4px rgba(16,185,129,0.2)" },
        },
      },
      animation: {
        "fade-in":    "fade-in 0.25s ease forwards",
        "slide-up":   "slide-up 0.3s ease forwards",
        "check-pop":  "check-pop 0.35s ease forwards",
        "glow-green": "glow-green 2s ease-in-out infinite",
      },
    },
  },

  plugins: [],
};

export default config;
