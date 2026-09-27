import type { Config } from "tailwindcss";

/**
 * Stellar.org palette (live site, 2026): #0F0F0F field, #FDDA24 accent, #FF3F00 danger.
 * Dark-first only; no light theme.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          canvas: "#0F0F0F",
          surface: "#0F0F0F",
          elevated: "#0F0F0F",
          soft: "#161616",
        },
        border: {
          DEFAULT: "#3A3A3A",
          default: "#3A3A3A",
          subtle: "#2A2A2A",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#969696",
          muted: "#969696",
        },
        brand: {
          blue: "#FDDA24",
          cyan: "#FDDA24",
        },
        semantic: {
          success: "#FDDA24",
          warning: "#FF3F00",
          danger: "#FF3F00",
          info: "#969696",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "var(--font-plex)",
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        display: [
          "var(--font-display)",
          "Arial Narrow",
          "Impact",
          "sans-serif",
        ],
      },
      fontSize: {
        display: ["48px", { lineHeight: "1.05", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "1.15", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.2", fontWeight: "650" }],
        h3: ["18px", { lineHeight: "1.25", fontWeight: "650" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.45", fontWeight: "400" }],
        label: ["12px", { lineHeight: "1.2", fontWeight: "600" }],
        data: ["28px", { lineHeight: "1.1", fontWeight: "650" }],
        mono: ["13px", { lineHeight: "1.35", fontWeight: "500" }],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
        "24": "96px",
      },
      borderRadius: {
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
      },
      maxWidth: {
        layout: "1440px",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "220ms",
      },
      transitionTimingFunction: {
        out: "ease-out",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(#FDDA24, #FDDA24)",
      },
    },
  },
  plugins: [],
};

export default config;
