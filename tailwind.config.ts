import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // DHL brand-ish palette for a playful sporty feel
        dhlYellow: "#FFCC00",
        dhlRed: "#D40511",
        ink: "#1a1a1a",
        // Retro-game accents used by the race section.
        retroSky: "#b4e5f5",
        retroGrass: "#86e08a",
        retroGrassDark: "#4fb256",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Press Start 2P — use small, sparingly (headings, stat readouts, labels).
        pixel: ["var(--font-pixel)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        // Offset solid shadow — no blur — for chunky NES card look.
        pixel: "4px 4px 0 0 #1a1a1a",
        pixelSm: "2px 2px 0 0 #1a1a1a",
      },
      keyframes: {
        bobbing: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        cheer: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "20%": { transform: "translateY(-16px) rotate(-6deg)" },
          "50%": { transform: "translateY(-24px) rotate(6deg)" },
          "80%": { transform: "translateY(-16px) rotate(-6deg)" },
        },
        sparkle: {
          "0%": { transform: "translateY(0) scale(0.5)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "translateY(-40px) scale(1.2)", opacity: "0" },
        },
      },
      animation: {
        bobbing: "bobbing 0.5s ease-in-out infinite",
        cheer: "cheer 0.8s ease-out",
        sparkle: "sparkle 1s ease-out forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
