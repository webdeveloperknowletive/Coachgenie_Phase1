import type { Config } from "tailwindcss";
export const baseConfig = {};

export const designTokens = {
  colors: {
    brand: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
      950: "#082f49",
    },
    accent: {
      50: "#fdf4ff",
      100: "#fae8ff",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7e22ce",
    },
    success: { 500: "#22c55e", 600: "#16a34a" },
    warning: { 500: "#f59e0b", 600: "#d97706" },
    danger:  { 500: "#ef4444", 600: "#dc2626" },
  },
  fontFamily: {
    sans:    ["var(--font-geist-sans)", "sans-serif"],
    mono:    ["var(--font-geist-mono)", "monospace"],
    display: ["var(--font-cal-sans)", "sans-serif"],
  },
  spacing: {
    sidebar: "16rem",
    header:  "4rem",
  },
} satisfies Partial<Config["theme"]>;

export const baseConfig: Omit<Config, "content"> = {
  darkMode: "class",
  theme: {
    extend: designTokens,
  },
  plugins: [],
};