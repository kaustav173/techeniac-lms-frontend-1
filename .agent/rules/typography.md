# Strict Typography Policy: Universal Plus Jakarta Sans

## Core Directive

The entire application **MUST** universally use **Plus Jakarta Sans** for all typography.

## Non-Negotiable Rules

1. **Zero Monospace Usage**: Never use `font-mono`, `ui-monospace`, `monospace`, or monospace font families anywhere across the UI. This applies to:
   - Codes, batch codes, IDs, and hashes
   - Dates, schedules, and timestamps
   - Counters, metrics, statistics, and badges
   - Table cells, headers, and pagination labels
   - Forms, inputs, dropdowns, and buttons
   - Authentication screens, banners, and modals
2. **Global Fallback Protection**: In `globals.css`, `@theme` maps `--font-sans`, `--font-serif`, and `--font-mono` directly to `Plus Jakarta Sans`. The universal selector `*, *::before, *::after` enforces `Plus Jakarta Sans` across all elements.
3. **No Mixed Fonts**: Do not introduce disparate fonts, custom font families, or unapproved webfonts into any component or layout.
