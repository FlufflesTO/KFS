/**
 * Project Sentinel - ESLint Configuration
 * Purpose: Lint rules for TypeScript and Astro files
 * Dependencies: @eslint/js
 * Structural Role: Code quality check
 */

import js from "@eslint/js";
import type { Linter } from "eslint";
import tseslint from "typescript-eslint";

const config: Linter.Config[] = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/**/*",
      ".astro/**/*",
      "node_modules/**/*",
      "public/**/*",
      "scratch/**/*",
      "test-auth.js"
    ]
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}", "scripts/**/*.{ts,js,mjs}", "tests/**/*.{ts,js}"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        Response: "readonly",
        Request: "readonly",
        Headers: "readonly",
        crypto: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Astro: "readonly"
      }
    },
    rules: {
      // Prevent tabnabbing: all external links must carry rel="noopener noreferrer".
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            'JSXAttribute[name.name="href"][value.type="Literal"][value.value=/^https?:\\/\\//]:not(:has(~ JSXAttribute[name.name="rel"]))',
          message:
            'External <a href="..."> must include rel="noopener noreferrer" to prevent tabnabbing.',
        },
      ],
      "no-useless-escape": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-undef": "off",
      "prefer-const": "off",
      "no-useless-assignment": "off",
      "no-case-declarations": "off",
      "no-empty-pattern": "off",
      "preserve-caught-error": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "no-var": "off"
    },
  },
];

export default config;
