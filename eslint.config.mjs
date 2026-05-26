import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{astro,ts,tsx,js,jsx}"],
    rules: {
      // Prevent tabnabbing: all external links must carry rel="noopener noreferrer".
      // Enforce in code review; this rule catches raw string patterns in JSX/Astro attrs.
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            'JSXAttribute[name.name="href"][value.type="Literal"][value.value=/^https?:\\/\\//]:not(:has(~ JSXAttribute[name.name="rel"]))',
          message:
            'External <a href="..."> must include rel="noopener noreferrer" to prevent tabnabbing.',
        },
      ],
    },
  },
];
