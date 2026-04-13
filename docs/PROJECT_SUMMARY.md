# Yoruba Flashcards — project summary (for new chats)

Use this file (or `@docs/PROJECT_SUMMARY.md`) to orient quickly. The **source of truth for product behavior** is `docs/yoruba-flashcards-spec.md`. **Implementation tracking** is `docs/TODO.md` (phases 1–3 are marked complete there; the codebase may contain additional work-in-progress beyond those checkboxes).

---

## What it is

**Yoruba Flashcards** is a browser-only React app for learning Yoruba vocabulary: flashcards, quizzes, progress in `localStorage`, optional TTS (Web Speech API), and Yoruba tone/diacritic support. **No backend** — data stays on the device.

**Repository path (this machine):** `/Users/rotimi98/Downloads/flashcards`

---

## Tech stack

| Area | Choice |
|------|--------|
| UI | React 19, TypeScript |
| Build | Vite 8, `tsc -b` |
| Routing | `react-router-dom` (BrowserRouter) |
| Global state | React Context + `useReducer` (`AppProvider`, `appReducer`) |
| Persistence | `localStorage` key `yoruba_flashcards_v1` via `saveState` / `loadState` |
| Lint/format | ESLint (flat config), Prettier |
| Unit tests | Vitest + React Testing Library (where present) |
| E2E | Playwright (`e2e/`, `playwright.config.ts`) |
| Charts | `recharts` (used where Stats/features require it) |

`vite.config.ts` uses **`base: './'`** for relative asset URLs. Some routes are **lazy-loaded** in `App.tsx` with `React.lazy` + `Suspense` for code-splitting.

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server (default port **5173** unless taken) |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | ESLint on `src/` |
| `npm run format` | Prettier on `src/**/*.{ts,tsx,css,json}` |
| `npm run test` | Vitest unit/component tests |
| `npm run test:e2e` | Playwright (starts dev server via config; uses **127.0.0.1:5173**) |
| `npm run test:e2e:ui` | Playwright UI mode |

First-time Playwright browsers: `npx playwright install` (or `chromium` only).

---

## Entry & routing

- **`index.html`** → **`src/main.tsx`**: `StrictMode` → **`ErrorBoundary`** → **`AppProvider`** → **`App`**.
- **`App.tsx`**: `BrowserRouter`, `Suspense`, nested routes under **`Layout`**:
  - `/` — Home  
  - `/study`, `/study/redo` — Study  
  - `/quiz` — Quiz  
  - `/cards` — Manage cards  
  - `/stats` — Statistics  
  - `/settings` — Settings (lazy)  
  - `*` → redirect to `/`

---

## Important source locations

| Path | Role |
|------|------|
| `src/types/index.ts` | `Flashcard`, `CardRecord`, `StudySession`, `AppSettings`, `PersistedState` |
| `src/constants/schema.ts` | `CURRENT_SCHEMA_VERSION` |
| `src/data/defaultCards.ts` | Preloaded deck (100+ cards) |
| `src/utils/storage.ts` | `loadState` / `saveState`, quota errors rethrown |
| `src/utils/createInitialState.ts` | Default `PersistedState` |
| `src/context/appReducer.ts` | All reducer actions |
| `src/context/AppProvider.tsx` | Provider, `saveState` in `useEffect`, schema migration dialog |
| `src/context/useApp.ts` | `useApp()` hook |
| `src/components/Layout/` | `Layout.tsx`, `Navbar.tsx`, CSS modules |
| `src/pages/` | Route-level pages (several have tests: `*.test.tsx`) |
| `src/components/Card/FlashCard.tsx` | Flashcard UI |
| `src/components/CharacterPicker/` | Yoruba character picker |
| `src/components/QuizMode/` | Quiz UI |
| `src/hooks/` | `useFlashcards`, `useSpeech`, `useLocalStorage`, etc. |
| `e2e/home-and-routing.spec.ts` | Smoke E2E: home + navbar + `/study/redo` + unknown route |

---

## Persistence & migration

- Stored JSON must include **`schemaVersion`**. On mismatch, **`SchemaMigrationDialog`** offers reset vs keep old data (see spec §10).
- **`saveState`** runs after state changes from the provider (migration flow delays persist until the user resolves the dialog, where implemented).

---

## UI / UX notes

- Global styles: **`src/index.css`** (theme variables, gradients).  
- **Do not** rely on opening `index.html` as a `file://` URL — use **`npm run dev`** or **`npm run preview`**.  
- Styling uses **warm neutrals + teal/amber accents**; some surfaces use **`Canvas` / `CanvasText`** for contrast.

---

## Git & deployment

- Project is a **git** repo; **`.gitignore`** covers `node_modules`, `dist`, env files, Playwright output, caches, `.cursor/mcp.json`, etc.  
- **Remote:** `origin` → `https://github.com/rotimi-98/flashcard.git` (pushed `main` branch with full history).
- **Hosting:** Deployed to **Vercel** (production). Auto-deploys on push to `main`.
  - Production URL: `https://flashcards-eight-nu.vercel.app`
- Confirm branch/commit with `git status` / `git log` in a new session.

---

## When continuing work

1. Read **`docs/TODO.md`** for the next unchecked phase.  
2. Cross-check **`docs/yoruba-flashcards-spec.md`** for acceptance details.  
3. Run **`npm run lint`**, **`npm run test`**, and **`npm run test:e2e`** before merging when touching behavior or routes.

---

---

## Chat session log

### Session: 2026-04-13 — Remote setup, deployment & GitHub issues

1. **Pushed to GitHub** — Added remote `origin` at `https://github.com/rotimi-98/flashcard.git` and pushed the `main` branch.
2. **Secured MCP config** — Added `.cursor/mcp.json` to `.gitignore` to prevent committing a file containing a GitHub token.
3. **Created GitHub issues** — Used the GitHub MCP integration to create issues on the repo:
   - [#1 — Test](https://github.com/rotimi-98/flashcard/issues/1) (placeholder)
   - [#2 — Implement `useFlashcards` hook (Phase 4.1)](https://github.com/rotimi-98/flashcard/issues/2) (first unresolved TODO item)
4. **Deployed to Vercel** — Built the production bundle and deployed via Vercel CLI. The app is live at `https://flashcards-eight-nu.vercel.app`. The GitHub repo is connected for automatic deployments on push.

---

*Last updated: 2026-04-13. Update this file when major architecture or workflows change.*
