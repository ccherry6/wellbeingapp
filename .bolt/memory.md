# Project memory

## Product intent & audience

- Starter/template project built on Vite + React.
- Includes coach-facing pages with dashboard, CSV export, and report export.

## Brand personality & voice

- (Not yet inferred beyond production-quality, non-cookie-cutter design preference from `.bolt/prompt`.)

## Visual design & UX direction

- UI uses JSX + Tailwind CSS classes; Lucide React for icons.
- Coach dashboard includes export actions (CSV, report).

## Decisions, constraints & rationale

- Only JSX, Tailwind, React hooks, and Lucide React for UI; avoid installing additional UI/icon packages unless necessary.
- Rationale: missing-package errors are install-state issues, not code bugs; prefer reinstall over code changes.

## Open questions & assumptions

- Export functionality (CSV/report) not yet browser-tested; verify after dependency fixes.
- No confirmation yet of app load after reinstall beyond successful production build.