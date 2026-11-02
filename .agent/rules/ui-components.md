# UI Components & Design System Rules

These rules are non-negotiable and apply to all agents and developers working on `TechEniac-lms-frontend`.

For the authoritative token values, colors, typography scales, and button sizes extracted from Figma, refer to [Design System Specifications](../../docs/DESIGN_SYSTEM.md).

## 1. Mandatory Component Reuse

Direct usage of unstyled or ad-hoc raw HTML primitives is strictly prohibited in application pages and feature components:

### Buttons (`<Button>`)

- **Prohibited**: `<button type="...">`
- **Mandatory**: Import `<Button>` from `@/components/ui/Button`.
- **Variants**: `primary`, `secondary`, `outline`, `ghost`, `danger`.
- **Sizes**: `sm`, `md`, `lg`.
- **Loading State**: Always pass `isLoading={boolean}` instead of manually appending SVG spinners.
- **Form Submissions**: When a button is inside a `<form>` and triggers submission, explicitly specify `type="submit"`. For all other actions, use `type="button"`.

### Typography (`<Typography>`, `<H1>`, `<H2>`, `<H3>`, `<H4>`, `<P>`, `<Span>`, `<Label>`, `<Code>`)

- **Prohibited**: Raw `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<p>`, `<span>`, `<code>`, `<label>` tags with custom font/size classes.
- **Mandatory**: Import `<Typography>` or its semantic aliases (`H1`, `H2`, `H3`, `H4`, `P`, `Span`, `Lead`, `Large`, `Small`, `Muted`, `Code`) from `@/components/ui/Typography`.
- **Labels**: Import `<Label>` from `@/components/ui/Label` for form field labels with built-in required indicator support (`required={true}`).

### Modals & Dialogs (`<Modal>`)

- **Prohibited**: Creating ad-hoc backdrop overlay `<div>`, fixed dialog containers, custom keydown escape handlers, or bespoke close buttons.
- **Mandatory**: Import `<Modal>` from `@/components/patterns/Modal` (or `@/components/ui/Modal`).
- **Accessibility**: `<Modal>` handles `role="dialog"`, `aria-modal="true"`, focus retention, backdrop blur, `Escape` key capture, and header/body/footer composition.

### Form Inputs (`<Input>`, `<FieldError>`)

- **Prohibited**: Raw `<input>` tags for text, email, password, or search.
- **Mandatory**: Import `<Input>` from `@/components/ui/Input` and `<FieldError>` from `@/components/ui/FieldError`.
- **Validation**: Wire `hasError={Boolean(error)}` and `errorId` for full ARIA accessibility (`aria-invalid`, `aria-describedby`).

### Data Tables (`<TableContainer>`, `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`)

- **Prohibited**: Raw HTML `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` tags.
- **Mandatory**: Import table components from `@/components/ui/Table`.
- **Styling**: Tables must reside within `<TableContainer>` to guarantee the unified `rounded-2xl border border-[#E1E6EC]` card structure, proper responsive scroll overflow, and hover row highlighting.

## 2. Architecture Confinement

- Components in `components/ui/**` are atomic primitives and must NEVER import from `components/app/**`, `hooks/**`, or `services/**`.
- Pattern components in `components/patterns/**` (like `Modal`) can compose `components/ui/**` primitives and non-domain utility hooks (such as `useDialogAccessibility`).
