import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        kharon: {
          blue: "#2563eb",
          purple: "#7c3aed",
          red: "#dc2626",
          amber: "#f59e0b",
          cyan: "#0891b2",
          green: "#16a34a",
          black: "#0f172a",
          grey: "#64748b",
          light: "#f8fafc",
          border: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        heading: ["Space Grotesk", ...fontFamily.sans],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'titan-drift': 'titanDrift 8s ease-in-out infinite',
        'linework-drift': 'lineworkDrift 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        titanDrift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(5px, 5px)' },
          '50%': { transform: 'translate(0, 10px)' },
          '75%': { transform: 'translate(-5px, 5px)' },
        },
        lineworkDrift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(3px, -3px)' },
        },
      }
    },
  },
  plugins: [],
};