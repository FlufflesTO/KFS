---
name: tailwind-css-patterns
description: Guidelines for styling with Tailwind CSS v4 and matching the "Industrial Command Intelligence" branding of the Kharon design constitution. Use when writing HTML, CSS, or adding style classes to components.
---

# Tailwind CSS v4 & Design Constitution Guidelines

This project utilizes **Tailwind CSS v4** with a CSS-first token configuration in `@theme` directives inside `@/styles/global.css`.

## Core Color Tokens (Strict Compliance)

Never use generic shades of colors or SaaS-like pastels. Always use the specified brand colors:
- **Primary Action**: `--color-kharon-purple` (`#4B2E83`) -> `bg-kharon-purple`
- **Hover States**: `--color-kharon-blue` (`#1F4E79`) -> `bg-kharon-blue`
- **Backgrounds/Headers**: `--color-kharon-black` (`#0B0D0F`) -> `bg-kharon-black`
- **Focus States**: `--color-kharon-cyan` (`#00C2FF`) -> `focus:ring-kharon-cyan`
- **Warnings**: `--color-kharon-amber` (`#F59E0B`) -> `text-kharon-amber`
- **Errors/Critical**: `--color-kharon-red` (`#C4332F`) -> `text-kharon-red`
- **Success/Valid**: `--color-kharon-green` (`#16A34A`) -> `text-kharon-green`

## Critical Layout Constraints

- **Touch Targets**: All interactive elements (buttons, links, inputs) MUST have a minimum dimension of `44x44px` (`min-w-[44px] min-h-[44px]`).
- **Typography**: Primary typeface is Inter (`font-sans`).
- **Icons**: No emojis. Use SVG icons only.
- **Global CSS Budget**: Under **120KB** (purged automatically via post-build task).
