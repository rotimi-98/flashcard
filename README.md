# Yoruba Flashcards

Browser-based Yoruba vocabulary learning with flashcards, quizzes, and progress tracking (see `docs/yoruba-flashcards-spec.md`).

## Tech stack

- React 18+
- TypeScript 5+
- Vite
- ESLint + Prettier
- Vitest (unit tests)
- Playwright (E2E tests)

## Setup

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default `http://localhost:5173`).

**Blank page or nothing loads:** The UI only runs when JavaScript loads. Use **`npm run dev`** and open the URL Vite prints (for example `http://localhost:5173`). After a production build, use **`npm run preview`** instead of double‑clicking `dist/index.html`—many browsers block ES modules on `file://` pages, which looks like a blank screen. Do not use generic “Live Server” extensions for this project; they do not compile TypeScript. If the screen is still empty, open DevTools (F12) → **Console** for errors. The app is built with a **relative asset base** (`./`) so deployed builds work from subpaths; if you see an on-screen error message, that is the error boundary catching a runtime failure.

## Scripts

| Script        | Description                                      |
| ------------- | ------------------------------------------------ |
| `npm run dev` | Start the Vite dev server with HMR               |
| `npm run build` | Typecheck and build for production             |
| `npm run preview` | Preview the production build locally         |
| `npm run lint` | Run ESLint on `src/`                           |
| `npm run format` | Format `src/` with Prettier                  |
| `npm run test` | Run Vitest unit tests                          |
| `npm run test:e2e` | Run Playwright E2E tests (starts dev server automatically) |
| `npm run test:e2e:ui` | Open Playwright UI mode for debugging |

First-time E2E setup: `npx playwright install chromium` (or `npx playwright install` for all browsers).

## Project structure (initial)

- `src/types/` — shared TypeScript interfaces
- `src/utils/` — helpers (`shuffle`, `storage`, etc.)
- `src/App.tsx`, `src/main.tsx` — app entry
- `public/` — static assets
- `docs/` — specification and implementation checklist
- `e2e/` — Playwright end-to-end tests

## Formatting

Prettier is configured via `.prettierrc`, and `eslint-config-prettier` disables ESLint rules that conflict with it. Run `npm run format` before committing.

**Editor (optional):** In VS Code or Cursor, you can enable format on save and set Prettier as the default formatter for this workspace so files match the same style when you save.

## Known limitations (v1.0)

- No cloud sync or user accounts (local storage only).
- Yoruba text-to-speech quality depends on the browser and installed system voices.
