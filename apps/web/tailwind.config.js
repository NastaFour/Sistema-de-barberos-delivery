/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(40 92% 52%)",
          50: "hsl(40 90% 96%)",
          100: "hsl(40 90% 90%)",
          200: "hsl(40 90% 80%)",
          300: "hsl(40 90% 70%)",
          400: "hsl(40 90% 60%)",
          500: "hsl(40 92% 52%)",
          600: "hsl(38 92% 44%)",
          700: "hsl(35 90% 36%)",
          800: "hsl(32 88% 26%)",
          900: "hsl(28 85% 18%)",
          950: "hsl(25 80% 10%)",
        },
        accent: {
          DEFAULT: "hsl(24 92% 56%)",
          400: "hsl(24 92% 66%)",
          500: "hsl(24 92% 56%)",
          600: "hsl(22 92% 46%)",
        },
        dark: {
          50: "hsl(220 20% 98%)",
          100: "hsl(220 20% 94%)",
          200: "hsl(220 18% 86%)",
          300: "hsl(220 16% 72%)",
          400: "hsl(220 14% 56%)",
          500: "hsl(220 14% 42%)",
          600: "hsl(220 16% 28%)",
          700: "hsl(220 18% 18%)",
          800: "hsl(220 20% 12%)",
          900: "hsl(220 22% 8%)",
          950: "hsl(222 25% 5%)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Outfit", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px hsla(40, 92%, 52%, 0.25)",
        float: "0 12px 30px -8px rgba(0, 0, 0, 0.6)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
