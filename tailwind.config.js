/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: "#0a0a0a",
        card: "#111111",
        border: "rgba(255,255,255,0.08)",
        primary: {
          DEFAULT: "#22c55e",
          glow: "rgba(34,197,94,0.15)",
          hover: "#16a34a",
        },
        text: {
          primary: "#ffffff",
          secondary: "#71717a",
          muted: "#3f3f46"
        },
        code: "#0d0d0d"
      },
      fontFamily: {
        pixel: ['var(--font-pixel)', 'cursive'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
        floatBlock: {
          "0%":   { transform: "translateY(0px) rotate(0deg)", opacity: "0.3" },
          "33%":  { transform: "translateY(-22px) rotate(6deg)", opacity: "0.5" },
          "66%":  { transform: "translateY(-12px) rotate(-4deg)", opacity: "0.35" },
          "100%": { transform: "translateY(0px) rotate(0deg)", opacity: "0.3" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulse_glow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(34,197,94,0.3)" },
          "50%":      { boxShadow: "0 0 40px rgba(34,197,94,0.7)" },
        },
        fadeInUp: {
          "0%":   { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        spotlight:   "spotlight 2s ease .75s 1 forwards",
        floatBlock:  "floatBlock 8s ease-in-out infinite",
        shimmer:     "shimmer 2.5s linear infinite",
        pulse_glow:  "pulse_glow 2s ease-in-out infinite",
        fadeInUp:    "fadeInUp 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};
