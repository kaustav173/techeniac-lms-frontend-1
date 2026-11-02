# TechEniac LMS - Design System & UI Specifications

This document defines the official design tokens, typography scale, color palette, and component specifications extracted directly from the TechEniac LMS Figma design system. All AI agents, contributors, and UI components in this workspace must strictly adhere to these specifications to guarantee visual consistency.

---

## 1. Design System Overview & Core Principles

- **Primary Font Family**: `'Plus Jakarta Sans', sans-serif`
- **Corner Radii for Interactive Buttons**: `32px` (Pill / fully rounded buttons)
- **Primary Brand Theme**: Electric Cobalt Blue (`#0044D3`)
- **Default Dark Text**: Charcoal Dark `#323232` (Display/Headings) and Midnight Slate `#111827` (Body)
- **Default Light Surface**: `#FFFFFF` (Pure White) and `#F6F8FC` (Soft Background Surface)
- **Component Consistency**: Never create ad-hoc inline styles or divergent button heights/paddings. All buttons and typography must map directly to the tokens specified herein.

---

## 2. Color Palette Tokens

### 2.1 Primary Brand Color

| Token Name                | Hex Code  | RGB               | Role / Usage                                                                 |
| :------------------------ | :-------- | :---------------- | :--------------------------------------------------------------------------- |
| `color-brand` / `primary` | `#0044D3` | `rgb(0, 68, 211)` | Primary buttons, active states, key CTAs, link highlights, and brand accents |

### 2.2 Basic & Neutral Foundation

| Token Name          | Hex Code  | RGB                  | Figma Role / Usage                                                      |
| :------------------ | :-------- | :------------------- | :---------------------------------------------------------------------- |
| `basic-dark`        | `#111827` | `rgb(17, 24, 39)`    | Deep dark neutral / high-contrast headings, main card headers           |
| `basic-gray-medium` | `#667085` | `rgb(102, 112, 133)` | Secondary text, inactive tab labels, metadata, secondary icons          |
| `basic-gray-border` | `#E1E6EC` | `rgb(225, 230, 236)` | Structural card borders, dividers, subtle table separators              |
| `basic-gray-light`  | `#F6F8FC` | `rgb(246, 248, 252)` | App canvas background, subtle table alternating rows, card hover states |
| `basic-white`       | `#FFFFFF` | `rgb(255, 255, 255)` | Surface containers, card backgrounds, modal shells, inverse text        |

### 2.3 Grayscale & Utility Colors

| Token Name      | Hex Code                | RGB                  | Usage                                                           |
| :-------------- | :---------------------- | :------------------- | :-------------------------------------------------------------- |
| `header-dark`   | `#33353B`               | `rgb(51, 53, 59)`    | Showcase and documentation header background                    |
| `text-dark`     | `#323232`               | `rgb(50, 50, 50)`    | Primary swatch labels, typography sample text, dominant UI text |
| `text-muted`    | `#969696`               | `rgb(150, 150, 150)` | Hex values, secondary metadata labels, timestamps               |
| `divider-light` | `#D8D8D8`               | `rgb(216, 216, 216)` | Section divider lines (1px), prefix markers (`#`)               |
| `border-light`  | `#F4F4F4`               | `rgb(244, 244, 244)` | Swatch container border (1px), subtle input outlines            |
| `shadow-swatch` | `rgba(51, 51, 51, 0.1)` | —                    | Swatch card drop shadow: `0px 1px 3px rgba(51, 51, 51, 0.1)`    |

### 2.4 Semantic Status Colors

| Semantic Role          | Token Name         | Hex Code  | RGB                 | Usage                                                             |
| :--------------------- | :----------------- | :-------- | :------------------ | :---------------------------------------------------------------- |
| **Success**            | `semantic-success` | `#12B76A` | `rgb(18, 183, 106)` | Completed status, success banners, active tags, positive metrics  |
| **Info / Secondary**   | `semantic-info`    | `#2E90FA` | `rgb(46, 144, 250)` | Informational callouts, active course badges, helper notes        |
| **Warning**            | `semantic-warning` | `#F79009` | `rgb(247, 144, 9)`  | Pending actions, deadline alerts, warning toasts                  |
| **Danger / Error**     | `semantic-danger`  | `#D92D20` | `rgb(217, 45, 32)`  | Destructive actions, validation error text, failure notifications |
| **Accent / Attention** | `semantic-accent`  | `#F2C75C` | `rgb(242, 199, 92)` | Highlight badges, star ratings, review tags, attention callouts   |

---

## 3. Typography Scale & Specifications

- **Font Family**: `'Plus Jakarta Sans', sans-serif`
- **Supported Weights**:
  - `Regular` (`font-weight: 400`)
  - `Medium` (`font-weight: 500` - Button labels & interactive badges)
  - `Semibold` (`font-weight: 600` - Headings & buttons)
  - `Bold` (`font-weight: 700` - Display titles & metric badges)

### 3.1 Typography Scale (Implemented in `Typography.tsx`)

| Variant     | Recommended Element | Tailwind Class Specification                                                | Font Size / Leading | Typical Use Case                  |
| :---------- | :------------------ | :-------------------------------------------------------------------------- | :------------------ | :-------------------------------- |
| **`h1`**    | `<h1>`              | `text-3xl font-bold tracking-tight text-foreground sm:text-4xl`             | `30px` (sm: `36px`) | Primary page headers, view titles |
| **`h2`**    | `<h2>`              | `text-2xl font-semibold tracking-tight text-foreground`                     | `24px`              | Section titles, modal headers     |
| **`h3`**    | `<h3>`              | `text-xl font-semibold tracking-tight text-foreground`                      | `20px`              | Card headers, panel titles        |
| **`h4`**    | `<h4>`              | `text-lg font-semibold tracking-tight text-foreground`                      | `18px`              | Subsection headers, group labels  |
| **`p`**     | `<p>`               | `text-base leading-7 text-foreground`                                       | `16px`              | Standard body copy                |
| **`lead`**  | `<p>`               | `text-lg leading-8 text-zinc-600 dark:text-zinc-400`                        | `18px`              | Lead/intro paragraphs             |
| **`large`** | `<div>`             | `text-lg font-semibold text-foreground`                                     | `18px`              | Emphasized body text              |
| **`small`** | `<small>`           | `text-sm font-medium leading-none text-foreground`                          | `14px`              | Metadata, microcopy               |
| **`muted`** | `<p>`               | `text-sm text-zinc-600 dark:text-zinc-400`                                  | `14px`              | Secondary/hint text               |
| **`code`**  | `<code>`            | `font-mono text-[0.9em] font-semibold bg-black/[.06] rounded px-1.5 py-0.5` | `~13px`             | Inline code tokens                |

---

## 4. Button System Specification

Buttons in the TechEniac LMS design system have a consistent pill shape with a `border-radius: 32px`. Button text is set in `'Plus Jakarta Sans'` with `font-weight: 500` (Medium).

### 4.1 Button Variants

#### Primary Button (Filled)

- **Background**: `#0044D3`
- **Text Color**: `#FFFFFF`
- **Border**: None
- **Border Radius**: `32px` (`rounded-full`)
- **Hover State**: `#0036AB`
- **Active State**: `#002B88`

#### Secondary Button (Outline)

- **Background**: `#FFFFFF`
- **Text Color**: `#0044D3`
- **Border**: `1px solid #0044D3`
- **Border Radius**: `32px` (`rounded-full`)
- **Hover State**: `#F6F8FC` with `#0036AB` border and text

---

### 4.2 Button Size Matrix

| Size Variant    | Target Height | Horizontal Padding | Font Size | Font Weight | Tailwind Specification (Implemented in `Button.tsx`) |
| :-------------- | :------------ | :----------------- | :-------- | :---------- | :--------------------------------------------------- |
| **LG (Large)**  | `48px`        | `28px`             | `16px`    | 600 (Semi)  | `h-12 px-7 text-base rounded-full`                   |
| **MD (Medium)** | `44px`        | `20px`             | `14px`    | 600 (Semi)  | `h-11 px-5 text-sm rounded-full`                     |
| **SM (Small)**  | `36px`        | `16px`             | `12px`    | 600 (Semi)  | `h-9 px-4 text-xs rounded-full`                      |

---

## 5. Implementation Rules for Developers & AI Agents

1. **Mandatory Token Usage**: Always use standard color tokens (`#0044D3` for brand actions, `#111827` / `#323232` for primary text, `#F6F8FC` for surface tints). Never introduce arbitrary ad-hoc hex values.
2. **Pill-Shaped Buttons**: When implementing buttons or interactive chips adhering to this system, ensure `rounded-full` (`rounded-[32px]`) is respected.
3. **Typography Primitives**: Use `<Typography>` or semantic exports (`H1`, `H2`, `H3`, `H4`, `P`, `Span`) from `@/components/ui/Typography`.
4. **Button Primitive**: Use `<Button>` from `@/components/ui/Button` configured with matching variant (`primary`, `secondary`, `outline`, `ghost`, `danger`) and supported size (`sm`, `md`, `lg`).
5. **No Style Drift in Chat/Prompts**: Any subsequent prompt or feature implementation should reference this document directly to maintain 100% design fidelity.

---

## 6. Table Pattern Specification (`components/ui/Table.tsx`)

The Table primitive provides accessible, structured tabular presentations for dashboards, user directories, and batch rosters.

- **Header (`TableHeader` & `TableHead`)**:
  - Background: Soft neutral surface `#F6F8FC`
  - Text: Secondary neutral `#667085`, `text-xs sm:text-sm font-semibold`
  - Border: `border-b border-[#E1E6EC]`
  - Accessibility: `TableHead` defaults to `scope="col"`.
- **Row (`TableRow`)**:
  - Padding / Separator: `border-b border-[#E1E6EC]`
  - Hover: Subtle surface tint `hover:bg-[#F6F8FC]/50` transition.
- **Cell (`TableCell`)**:
  - Horizontal & Vertical Padding: `px-6 py-4`
  - Typography: Default text `#111827`, aligned with primary neutral tokens.

---

## 7. Skeleton Loading Pattern (`components/ui/Skeleton.tsx`)

Used for accessible, non-jarring loading placeholders.

- **Component**: `<Skeleton />` (built with `React.forwardRef` and `aria-hidden="true"`).
- **Visual Style**: Pulse animation `animate-pulse rounded-xl bg-slate-200/80`.
- **Behavioral Rule**: Mount skeleton shapes only during initial cold data fetching (`isInitialLoading`). For background refetches (search, filter, pagination, mutations), preserve existing rows and dim via `opacity-60 transition-opacity` to prevent layout shift and maintain `keepPreviousData`.

---

## 8. Pagination Controls Pattern (`components/patterns/PaginationControls.tsx`)

Used across data tables and lists to paginate result sets predictably.

- **Component**: `<PaginationControls />`
- **Page Number Cutoff**: Renders full page numbers without ellipsis when `totalPages <= 6`. When `totalPages > 6`, dynamic ellipsis is placed around the active page window.
- **Active Page Pill**: Pill button (`rounded-full bg-[#0044D3] text-white`).
- **Inactive / Arrow Buttons**: Accessible `<Button size="sm" variant="ghost">` or outline pills with `aria-label` tags for screen readers.
- **Page Size Selector**: Dropdown supporting page limits `[10, 20, 50, 100]` with total item counters (`Showing X to Y of Z entries`).

---

## 9. Sidebar Navigation & Layout Grid (`context/SidebarContext.tsx`, `components/layout/Header.tsx`)

- **Rail State (Desktop `md:flex`)**: Compact 80px (`w-20`) collapsed navigation rail fixed to the left, displaying primary navigation icons with hover tooltips.
- **Expanded Drawer State**: 288px (`w-72`) overlay drawer displaying full navigation labels, category groupings, and product branding.
- **Centralized Layout Offset**: `useSidebar().contentMarginClass` dynamically provides `md:ml-20` (collapsed) or `md:ml-72` (expanded) to `Header`, `DashboardContent`, and `PortalSessionState`.
- **Mobile Responsive Navigation (`< md`)**: Hamburger menu button in `Header` toggles the drawer over a backdrop overlay (`bg-slate-900/30 backdrop-blur-2xs`) without horizontal content shifting.
