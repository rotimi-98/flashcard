# Yoruba Flashcards

A browser-based Yoruba vocabulary learning app with flashcards, quizzes, text-to-speech, and progress tracking. Built with React and TypeScript; all data persists in `localStorage` — no account needed.

See `docs/yoruba-flashcards-spec.md` for the full specification.

## Tech stack

- **React 19** + **TypeScript 5** — UI and type safety
- **Vite** — dev server and production bundler
- **Recharts** — statistics charts
- **Web Speech API** — text-to-speech pronunciation
- **CSS Modules** — scoped component styles
- **Vitest** + **React Testing Library** — unit and component tests
- **Playwright** — end-to-end tests
- **ESLint** + **Prettier** — code quality and formatting

## Setup

```bash
git clone <repo-url>
cd flashcards
npm install
npm run dev
```

Open the URL shown in the terminal (default `http://localhost:5173`).

For E2E tests, install browser binaries once:

```bash
npx playwright install chromium
```

## Scripts

| Script                | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Start the Vite dev server with HMR                     |
| `npm run build`       | Type-check and build for production                    |
| `npm run preview`     | Preview the production build locally                   |
| `npm run lint`        | Run ESLint on `src/`                                   |
| `npm run format`      | Format `src/` with Prettier                            |
| `npm run test`        | Run Vitest unit and component tests                    |
| `npm run test:e2e`    | Run Playwright E2E tests (starts dev server automatically) |
| `npm run test:e2e:ui` | Open Playwright UI mode for debugging                  |

## Project structure

```
src/
├── components/          # Reusable UI components
│   ├── Card/            # FlashCard (3D flip)
│   ├── CharacterPicker/ # Yoruba tone mark / underdot input
│   ├── Layout/          # Navbar + page shell
│   ├── QuizMode/        # MultipleChoice, FillInTheBlank, QuizSummary
│   ├── SpeechBanner/    # "No Yoruba voice" notice
│   ├── StorageBanner/   # "Private browsing" notice
│   └── Toast/           # Transient notification system
├── context/             # AppContext, AppProvider, reducer
├── data/                # Default flashcard deck (~118 cards)
├── hooks/               # useFlashcards, useSpeech, useLocalStorage
├── pages/               # Route-level pages (lazy-loaded)
├── types/               # Shared TypeScript interfaces
├── utils/               # Helpers (shuffle, storage, answerEval, etc.)
├── App.tsx              # Router with code-split routes
├── main.tsx             # Entry point
└── index.css            # Global styles + CSS custom properties
e2e/                     # Playwright E2E tests
docs/                    # Specification and TODO checklist
```

## Features

- **Study mode** — shuffle and flip through flashcards; self-assess as correct or wrong
- **Redo wrong cards** — revisit only the cards you missed
- **Quiz mode** — multiple choice or fill-in-the-blank with configurable direction and count
- **Manage cards** — add, edit, and delete custom cards; search the deck
- **Character picker** — Yoruba tone marks and underdots with keyboard navigation
- **Text-to-speech** — pronounce words in Yoruba and English (browser-dependent)
- **Statistics** — KPIs, accuracy chart, study activity chart, sortable card performance table
- **Settings** — toggle speech, adjust rate, select voice, configure auto-flip
- **Dark mode** — respects `prefers-color-scheme: dark` automatically
- **Accessibility** — ARIA labels, live regions, keyboard navigation, focus indicators, reduced motion support
- **Offline** — fully client-side; works without an internet connection after first load

## Known limitations

- **No cloud sync or accounts** — all progress is stored in `localStorage` and is device-specific.
- **Yoruba TTS quality** varies by browser and OS. Install a Yoruba voice pack for best results; the app falls back to the default voice otherwise.
- **Private browsing** — progress won't persist between sessions (a banner warns the user).
