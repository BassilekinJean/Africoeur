import type { Config } from "tailwindcss";

/**
 * Palette « terre & soleil » — direction artistique chaude, éditoriale et digne,
 * inspirée des terres d'Afrique : argile/terracotta, savane ocre, forêt profonde,
 * sable crème. Aucune teinte « SaaS » froide.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#FBF7F0",
          100: "#F5EDE0",
          200: "#EBDCC4",
          300: "#DCC4A0",
        },
        clay: {
          50: "#FBEEE8",
          100: "#F2D2C4",
          400: "#D9714B",
          500: "#C2562F",
          600: "#A8431F",
          700: "#883316",
        },
        forest: {
          50: "#E9F0EC",
          400: "#3E7A63",
          500: "#205D47",
          600: "#13452F",
          700: "#0C3122",
        },
        ochre: {
          400: "#E7A938",
          500: "#D8901A",
          600: "#B57311",
        },
        ink: {
          DEFAULT: "rgb(42 29 20 / <alpha-value>)",
          soft: "#5A4636",
          muted: "#897662",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(42,29,20,0.04), 0 8px 24px -12px rgba(42,29,20,0.18)",
        lift: "0 24px 60px -28px rgba(42,29,20,0.45)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        inout: "cubic-bezier(0.77, 0, 0.175, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.23,1,0.32,1) both",
        "scale-in": "scale-in 0.5s cubic-bezier(0.23,1,0.32,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
