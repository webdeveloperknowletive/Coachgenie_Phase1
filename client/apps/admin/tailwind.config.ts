// import type { Config } from "tailwindcss";
// import { baseConfig } from "@coachgenie/config/tailwind";

// export default {
//   ...baseConfig,
//   content: [
//     "./app/**/*.{ts,tsx}",
//     "./components/**/*.{ts,tsx}",
//     "../../packages/ui/src/**/*.{ts,tsx}",
//   ],
// } satisfies Config;

import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",   // ✅ covers (dashboard)
    "./components/**/*.{js,ts,jsx,tsx}",
    
    // ✅ VERY IMPORTANT (monorepo safety)
    "../../packages/**/*.{js,ts,jsx,tsx}",

    // ✅ fallback (ensures nothing is missed)
    "./**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "border-border",
    "bg-background",
    "text-foreground",
  ],
  theme: {
    extend: {
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
    },
  },
  plugins: [],
} satisfies Config;