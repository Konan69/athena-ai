import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const neonPlugin = plugin(function ({ addUtilities, addVariant }) {
  addUtilities({
    ".neon-glow": {
      boxShadow:
        "0 0 10px color-mix(in oklch, oklch(0.72 0.25 300) 60%, white 40%), 0 0 24px color-mix(in oklch, oklch(0.72 0.25 300) 40%, black 60%), 0 0 48px color-mix(in oklch, oklch(0.72 0.25 300) 30%, black 70%)",
    },
    ".neon-border": {
      border:
        "1px solid color-mix(in oklch, oklch(0.72 0.25 300) 55%, transparent)",
      boxShadow:
        "0 0 0 1px color-mix(in oklch, oklch(0.72 0.25 300) 25%, transparent) inset, 0 0 18px color-mix(in oklch, oklch(0.72 0.25 300) 25%, transparent)",
    },
    ".neon-gradient": {
      background:
        "linear-gradient(135deg, color-mix(in oklch, oklch(0.72 0.25 300) 85%, transparent) 0%, color-mix(in oklch, oklch(0.78 0.23 330) 75%, transparent) 40%, color-mix(in oklch, oklch(0.82 0.14 200) 65%, transparent) 100%)",
    },
    ".glass": {
      background:
        "color-mix(in oklch, var(--color-sidebar, oklch(0.985 0 0)) 92%, transparent)",
      backdropFilter: "saturate(125%) blur(8px)",
      WebkitBackdropFilter: "saturate(125%) blur(8px)",
    },
    ".hover-tilt": {
      transformStyle: "preserve-3d",
      transition: "transform 200ms ease, filter 200ms ease",
    },
    ".hover-tilt:hover": {
      transform: "translateZ(0) rotateX(3deg) rotateY(-3deg)",
      filter:
        "drop-shadow(0 6px 16px color-mix(in oklch, oklch(0.72 0.25 300) 35%, transparent))",
    },
    ".neon-focus": {
      boxShadow:
        "0 0 0 2px color-mix(in oklch, oklch(0.72 0.25 300) 60%, transparent)",
    },
  });

  addVariant("hocus", ["&:hover", "&:focus-visible"]);
});

const config: Config = {
  darkMode: "class",
  // Ensure Tailwind scans shadcn ui components and any ts files for dynamic classes
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: "oklch(0.72 0.25 300)",
          "purple-200": "oklch(0.82 0.19 300)",
          "purple-400": "oklch(0.70 0.25 300)",
          "purple-600": "oklch(0.58 0.25 300)",
          cyan: "oklch(0.82 0.14 200)",
          pink: "oklch(0.78 0.23 330)",
        },
      },
      boxShadow: {
        "neon-purple":
          "0 0 10px color-mix(in oklch, oklch(0.72 0.25 300) 60%, white 40%), 0 0 24px color-mix(in oklch, oklch(0.72 0.25 300) 40%, black 60%), 0 0 48px color-mix(in oklch, oklch(0.72 0.25 300) 30%, black 70%)",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { filter: "drop-shadow(0 0 0 rgba(0,0,0,0))" },
          "50%": {
            filter:
              "drop-shadow(0 0 12px color-mix(in oklch, oklch(0.72 0.25 300) 60%, transparent))",
          },
        },
        labelShimmer: {
          "0%": { backgroundPositionX: "-200%" },
          "100%": { backgroundPositionX: "200%" },
        },
        fadeSlideIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "glow-pulse": "glowPulse 2.2s ease-in-out infinite",
        "label-shimmer": "labelShimmer 2.2s linear infinite",
        "fade-slide-in": "fadeSlideIn 0.26s ease forwards",
      },
      backgroundImage: {
        "label-shimmer":
          "linear-gradient(90deg, transparent 0%, color-mix(in oklch, oklch(0.72 0.25 300) 45%, transparent) 20%, color-mix(in oklch, oklch(0.72 0.25 300) 65%, transparent) 40%, transparent 60%)",
        "neon-gradient":
          "linear-gradient(135deg, color-mix(in oklch, oklch(0.72 0.25 300) 85%, transparent) 0%, color-mix(in oklch, oklch(0.78 0.23 330) 75%, transparent) 40%, color-mix(in oklch, oklch(0.82 0.14 200) 65%, transparent) 100%)",
      },
      borderColor: {
        "neon-purple": "oklch(0.72 0.25 300 / 0.55)",
      },
    },
  },
  plugins: [neonPlugin],
};

export default config;
