import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        kharon: {
          purple: "#4B2E83",
          blue: "#1F4E79",
          black: "#0B0D0F",
          charcoal: "#15191D",
          grey: "#2B3138",
          light: "#F3F5F7",
          border: "#D6D9DD",
          amber: "#F59E0B",
          cyan: "#00C2FF",
          red: "#C4332F",
          green: "#16A34A",
        },
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        heading: ["Inter", ...fontFamily.sans],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '1.875rem' }],
        '3xl': ['1.875rem', { lineHeight: '2rem' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
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
} satisfies Config;
