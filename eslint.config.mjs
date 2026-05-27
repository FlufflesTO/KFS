/**
 * Project Sentinel - ESLint Configuration
 * Purpose: Lint rules for JavaScript files
 * Dependencies: @eslint/js
 * Structural Role: Code quality check
 */

import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: [
      "src/**/*.astro",
      "src/**/*.ts",
      "src/**/*.tsx",
      "dist/**/*",
      ".astro/**/*",
      "node_modules/**/*"
    ]
  },
  {
    files: ["src/**/*.js", "src/**/*.jsx", "scripts/**/*.mjs", "scripts/**/*.js"],
    languageOptions: {
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
      "no-useless-escape": "off"
    },
  },
];
