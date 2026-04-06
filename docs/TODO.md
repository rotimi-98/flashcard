# Yoruba Flashcards — Implementation TODO

> Features are grouped into phases ordered from easiest to most complex.
> Each checkbox represents one discrete, shippable unit of work.

---

## Phase 1 — Project Scaffolding

- [x] **1.1 Initialise Vite + React + TypeScript project**
  - **Acceptance Criteria:**
    - `npm create vite@latest` produces a working project with React 18+ and TypeScript 5+.
    - `npm run dev` starts a local dev server with no errors.
    - `index.html`, `App.tsx`, and `main.tsx` are present under the directory structure defined in §4.1.
    - `vite.config.ts` and `tsconfig.json` exist and are valid.

- [x] **1.2 Configure ESLint and Prettier**
  - **Acceptance Criteria:**
    - `npm run lint` runs ESLint across `src/` with zero baseline errors on a fresh project.
    - Prettier is integrated (either via ESLint plugin or standalone config).
    - A `.prettierrc` and `.eslintrc` (or `eslint.config.ts`) are committed to the repo.
    - Saving a file in the editor auto-formats it (optional but documented in README).

- [x] **1.3 Define all shared TypeScript interfaces**
  - **File:** `src/types/index.ts`
  - **Acceptance Criteria:**
    - `Flashcard`, `CardRecord`, `StudySession`, `AppSettings`, and `PersistedState` interfaces are defined exactly as specified in §5.1.
    - The file compiles with `tsc --noEmit` with zero errors.
    - All fields have correct types and JSDoc comments matching the spec.

- [x] **1.4 Implement `shuffle.ts` utility**
  - **File:** `src/utils/shuffle.ts`
  - **Acceptance Criteria:**
    - Exports a `fisherYatesShuffle<T>(arr: T[]): T[]` function.
    - The function returns a new array (does not mutate the original).
    - Output array length equals input array length.
    - All original elements are present in the output.
    - Unit test: running the shuffle 100× on a 10-item array produces at least 5 distinct orderings.

- [x] **1.5 Implement `storage.ts` helpers**
  - **File:** `src/utils/storage.ts`
  - **Acceptance Criteria:**
    - Exports `loadState(): PersistedState | null` and `saveState(state: PersistedState): void`.
    - Uses the localStorage key `"yoruba_flashcards_v1"` as defined in §5.2.
    - JSON serialisation and deserialisation are handled correctly.
    - `QuotaExceededError` is caught in `saveState`; the error is re-thrown or a callback is invoked so the caller can display a toast (§10).
    - `loadState` returns `null` (not throws) if the key is absent or JSON is malformed.

---

## Phase 2 — Data Layer & State Management

- [ ] **2.1 Create the default card dataset**
  - **File:** `src/data/defaultCards.ts`
  - **Acceptance Criteria:**
    - Contains a minimum of 100 `Flashcard` objects with `isPreloaded: true`.
    - Cards cover all required topics: greetings, numbers 1–20, days of the week, common nouns, verbs, and adjectives (§6.1).
    - Every card has a unique `id` (UUID v4 format), a non-empty `yoruba` field with correct tone marks, and a non-empty `english` field.
    - The file imports and exports without TypeScript errors.

- [ ] **2.2 Implement `useLocalStorage` hook**
  - **File:** `src/hooks/useLocalStorage.ts`
  - **Acceptance Criteria:**
    - Signature matches `function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]` (§7.3).
    - On mount, reads from `localStorage` and initialises React state with the stored value (or `initialValue` if absent).
    - The setter updates both React state and `localStorage` atomically within the same call.
    - When `localStorage` is unavailable (e.g., private browsing throws), the hook falls back to in-memory state and logs a `console.warn`.
    - Unit test: setter persists a value that is readable by a subsequent `getItem` call on a mocked `localStorage`.

- [ ] **2.3 Implement `AppContext` and `useReducer`**
  - **File:** `src/context/AppContext.tsx`
  - **Acceptance Criteria:**
    - Context provides the full `PersistedState` shape and a `dispatch` function.
    - All 10 action types from §8 are handled: `ADD_CARD`, `EDIT_CARD`, `DELETE_CARD`, `RECORD_OUTCOME`, `START_SESSION`, `END_SESSION`, `RESET_WRONG_FLAGS`, `RESET_ALL_PROGRESS`, `UPDATE_SETTINGS`, `LOAD_STATE`.
    - Each action produces the correct next state (unit-tested for each type).
    - A `useEffect` watching state changes calls `saveState()` after every mutation.
    - On app init, `LOAD_STATE` is dispatched with data from `loadState()`; if `null`, the default dataset is used.

- [ ] **2.4 Implement schema version migration / reset prompt**
  - **Acceptance Criteria:**
    - A `CURRENT_SCHEMA_VERSION` constant is defined and checked on `LOAD_STATE`.
    - If the stored `schemaVersion` does not match, a modal/dialog prompts the user: *"Your saved data is from an older version. Reset and start fresh?"* with Confirm/Cancel buttons (§10).
    - Confirming resets to the default dataset and current schema version; cancelling loads the old data as-is.
    - The schema version is incremented in the constant (not hardcoded in multiple places).

---

## Phase 3 — Routing & Shell Layout

- [ ] **3.1 Install and configure React Router v6**
  - **Acceptance Criteria:**
    - `react-router-dom` v6 is installed and listed in `package.json`.
    - All six routes from §4.2 (`/`, `/study`, `/study/redo`, `/quiz`, `/cards`, `/stats`) are registered in `App.tsx`.
    - Navigating to each route renders the correct page component without a 404 or blank screen.
    - The router uses `BrowserRouter` (or `createBrowserRouter`); no hash-based routing.

- [ ] **3.2 Build the `Layout` and `Navbar` components**
  - **Files:** `src/components/Layout/Layout.tsx`, `Navbar.tsx`
  - **Acceptance Criteria:**
    - `Navbar` displays links to Home, Study, Quiz, Cards, and Stats.
    - The active route's link is visually distinguished (e.g., bold or underline).
    - `Layout` wraps all pages and renders `Navbar` at the top and `<Outlet />` (or `children`) below.
    - Layout is responsive: on mobile the nav collapses or stacks; on desktop it displays horizontally.
    - All nav links are keyboard-navigable and have visible focus indicators.

- [ ] **3.3 Build the `HomePage`**
  - **File:** `src/pages/HomePage.tsx`
  - **Acceptance Criteria:**
    - Displays the app name and a brief description.
    - Contains navigation buttons/cards linking to Study, Quiz, and Manage Cards pages.
    - If any cards are currently flagged `isMarkedWrong: true`, a **"Redo Wrong Cards"** button is visible and navigates to `/study/redo`.
    - Renders correctly on mobile (375px), tablet (768px), and desktop (1024px).

---

## Phase 4 — Flashcard Study Mode

- [ ] **4.1 Implement `useFlashcards` hook**
  - **File:** `src/hooks/useFlashcards.ts`
  - **Acceptance Criteria:**
    - Accepts a list of cards and an optional `redoWrongOnly: boolean` flag.
    - On init, shuffles the card list using `fisherYatesShuffle`.
    - When `redoWrongOnly` is `true`, filters the deck to cards where `isMarkedWrong: true` before shuffling.
    - Exposes: `currentCard`, `currentIndex`, `totalCards`, `goNext()`, `goPrev()`, `markCorrect()`, `markWrong()`, `isSessionComplete`.
    - `markCorrect()` dispatches `RECORD_OUTCOME` with `timesCorrect + 1` and sets `isMarkedWrong: false`.
    - `markWrong()` dispatches `RECORD_OUTCOME` with `timesWrong + 1` and sets `isMarkedWrong: true`.
    - `goPrev()` navigates back but does not re-record the prior card's outcome.

- [ ] **4.2 Build the `FlashCard` component**
  - **File:** `src/components/Card/FlashCard.tsx`
  - **Acceptance Criteria:**
    - Props match the `FlashCardProps` interface in §7.1.
    - Card front shows Yoruba word in large typography; card back shows English translation and optional notes.
    - A CSS 3D flip animation (Y-axis, ~300ms, `backface-visibility: hidden`) plays on click/tap.
    - A **"Tap to flip"** affordance (text label or icon) is visible on the front face.
    - Speaker icon on front triggers `onSpeak(card.yoruba, 'yo')`; speaker icon on back triggers `onSpeak(card.english, 'en-US')`.
    - ✅ "Got it" and ❌ "Still learning" buttons are hidden when `isFlipped = false` and visible when `isFlipped = true`.
    - Card flip announces to screen readers via `aria-live="polite"`.
    - Animation is suppressed when `prefers-reduced-motion: reduce` is detected.

- [ ] **4.3 Build the `StudyPage`**
  - **File:** `src/pages/StudyPage.tsx`
  - **Acceptance Criteria:**
    - Reads route path to determine if mode is standard (`/study`) or redo (`/study/redo`).
    - Displays progress indicator: "Card X of N".
    - Renders `FlashCard` for the current card.
    - Renders previous/next navigation arrows; arrows are disabled at the boundaries.
    - Dispatches `START_SESSION` on mount and `END_SESSION` when the session completes.
    - When the deck is empty (0 cards), shows an empty-state message with a link to add cards (§10).
    - On reaching the last card and pressing an assessment button, transitions to the Session Summary screen.

- [ ] **4.4 Build the Session Summary screen**
  - **Acceptance Criteria:**
    - Displays: total cards reviewed, correct count, wrong count, and percentage correct.
    - **"Redo Wrong Cards"** button is visible only if ≥ 1 card is `isMarkedWrong: true`; navigates to `/study/redo`.
    - **"Study Again"** button reshuffles all active cards and restarts the session without navigating away.
    - **"Go Home"** button navigates to `/`.
    - The session's `StudySession` record (with correct `mode`, `totalCards`, `correctCount`, `wrongCount`) is present in `localStorage` after completion.

---

## Phase 5 — Manage Cards Page

- [ ] **5.1 Build the card list view**
  - **File:** `src/pages/ManageCardsPage.tsx`
  - **Acceptance Criteria:**
    - Displays all cards (pre-loaded + user-created) in a scrollable list.
    - Each row shows: Yoruba word, English translation, a speaker icon (calls TTS), an edit button, and a delete button.
    - Pre-loaded cards display a 🔒 lock icon instead of a delete button; the edit button is hidden.
    - A search input filters the list in real-time by Yoruba or English text (case-insensitive).
    - List is accessible via keyboard; each row's buttons are focusable and labelled.

- [ ] **5.2 Build the Add/Edit card form**
  - **Acceptance Criteria:**
    - Form fields: `Yoruba` (required), `English` (required), `Notes` (optional textarea).
    - Both required fields show an inline validation error if submitted while empty.
    - Submitting a valid new card dispatches `ADD_CARD` with a generated UUID, `isPreloaded: false`, and the current ISO timestamp for `createdAt`.
    - When opened in edit mode, the form is pre-populated with the existing card's data and dispatches `EDIT_CARD` on submit.
    - After successful submission, the form resets and the new/updated card appears in the card list.

- [ ] **5.3 Implement delete with confirmation dialog**
  - **Acceptance Criteria:**
    - Clicking the delete button opens a confirmation dialog: *"Delete this card? This cannot be undone."* with Confirm and Cancel buttons.
    - Confirming dispatches `DELETE_CARD` and removes the card from the list.
    - Cancelling closes the dialog with no state change.
    - The confirmation dialog is accessible: focus is trapped inside it, `Escape` cancels, and it has `role="alertdialog"` with a descriptive `aria-label`.
    - Attempting to delete a pre-loaded card is impossible (delete button is not rendered for those cards).

---

## Phase 6 — Character Picker

- [ ] **6.1 Build the `CharacterPicker` component — character grid**
  - **File:** `src/components/CharacterPicker/CharacterPicker.tsx`
  - **Acceptance Criteria:**
    - Renders all characters specified in §6.3.1 (lowercase and uppercase variants), including underdot variants: ẹ, ọ, ṣ and their tone-marked forms.
    - Characters are grouped logically (by base character).
    - Each character button has an `aria-label` describing the character name (e.g., `"e with low tone"`).
    - The panel has `role="dialog"` and a descriptive `aria-label="Yoruba character picker"`.
    - The component renders without TypeScript errors and matches the `CharacterPickerProps` interface in §7.2.

- [ ] **6.2 Implement character insertion at cursor**
  - **Acceptance Criteria:**
    - Clicking a character button inserts the character at the current cursor position in the `targetRef` input/textarea (not at the end and not replacing the full value).
    - After insertion, the cursor is positioned immediately after the inserted character.
    - The insertion logic uses `setSelectionRange` as described in §7.2.
    - Inserting a character when text is selected replaces the selection with the character.
    - The `onInsert` callback is called with the inserted character string.

- [ ] **6.3 Implement picker open/close behaviour and keyboard nav**
  - **Acceptance Criteria:**
    - The picker appears as a floating panel anchored below the associated input when the toggle button is clicked.
    - It is dismissed by: clicking outside, pressing `Escape`, or clicking the toggle button again.
    - Arrow keys navigate focus between character buttons within the panel.
    - Pressing `Enter` on a focused character button inserts the character.
    - Clicking outside the panel (outside both the panel and toggle button) closes it without inserting a character.
    - Panel open/close state does not affect `localStorage` or app state.

---

## Phase 7 — Text-to-Speech

- [ ] **7.1 Implement `useSpeech` hook**
  - **File:** `src/hooks/useSpeech.ts`
  - **Acceptance Criteria:**
    - Return type matches `UseSpeechReturn` as defined in §7.4.
    - `speak(text, lang)` constructs a `SpeechSynthesisUtterance`, sets `lang`, `rate` (from settings), and optional `voice`; cancels any in-progress utterance before speaking.
    - `stop()` calls `window.speechSynthesis.cancel()`.
    - `isSpeaking` is `true` while speech is active and `false` otherwise.
    - `isSupported` is `false` when `window.speechSynthesis` is `undefined`.
    - `availableVoices` is populated after the `voiceschanged` event fires (handles Chrome's async voice loading).
    - Unit test: `speak` and `stop` are called on a mocked `window.speechSynthesis`.

- [ ] **7.2 Integrate TTS into speaker icon buttons**
  - **Acceptance Criteria:**
    - All speaker icon buttons (card front, card back, card list) call `speak` with the correct text and language tag.
    - When `isSpeaking` is `true`, the button shows an animated waveform or stop icon and has `aria-busy="true"`.
    - All speaker buttons have `aria-label="Pronounce [word]"`.
    - When `settings.speechEnabled = false`, speaker buttons are greyed out, `disabled`, and non-interactive.
    - When `isSupported = false`, speaker buttons are hidden entirely and a one-time notice is shown in Settings.

- [ ] **7.3 Implement no-Yoruba-voice fallback banner**
  - **Acceptance Criteria:**
    - On app load, after `voiceschanged` fires, the app checks if any available voice has a language tag starting with `"yo"`.
    - If no Yoruba voice is found, an informational banner is displayed: *"No Yoruba voice is installed on your device. Speech will use the default voice."* with guidance to check system TTS settings (§6.6.2).
    - The banner is dismissible and does not reappear after dismissal within the same session.
    - TTS still works (with default voice) when the banner is shown.

---

## Phase 8 — Redo Wrong Cards Mode

- [ ] **8.1 Implement `/study/redo` route and filtering**
  - **Acceptance Criteria:**
    - Navigating to `/study/redo` enters Study Mode filtered to cards where `isMarkedWrong: true`.
    - If no cards are marked wrong, the route shows an empty-state message: *"No cards to redo! Great work."* with a link to `/study`.
    - Marking a card ✅ "Got it" during a redo session dispatches `RESET_WRONG_FLAGS` for that card's ID, setting `isMarkedWrong: false`.
    - Marking a card ❌ again keeps `isMarkedWrong: true`.
    - After completing the redo session, the Session Summary screen shows updated counts and another "Redo Wrong Cards" button if any cards are still wrong.
    - The session is recorded in `localStorage` with `mode: 'redo-wrong'`.

---

## Phase 9 — Quiz Mode

- [ ] **9.1 Build the Quiz Setup screen**
  - **File:** `src/pages/QuizPage.tsx`
  - **Acceptance Criteria:**
    - Allows the user to select: Quiz Type (Multiple Choice | Fill-in-the-Blank), Direction (Yoruba → English | English → Yoruba), and Number of Questions (5 | 10 | 20 | All).
    - All three options have sensible defaults pre-selected.
    - If the deck has fewer than 4 cards, Multiple Choice is disabled and an explanatory message is shown (§10).
    - If the deck has 0 cards, both quiz types are disabled with a prompt to add cards.
    - Clicking **"Start Quiz"** transitions to the active quiz session using the selected configuration.

- [ ] **9.2 Build the Multiple Choice quiz**
  - **File:** `src/components/QuizMode/MultipleChoice.tsx`
  - **Acceptance Criteria:**
    - Displays a question prompt using the configured direction.
    - Shows 4 answer option buttons: 1 correct answer + 3 distractors drawn randomly from other deck cards.
    - Selecting the correct answer turns its button green and shows brief positive feedback text.
    - Selecting a wrong answer turns the selected button red and highlights the correct answer green.
    - A TTS speaker icon next to the Yoruba prompt is present and functional.
    - Once an answer is selected, all buttons are disabled; the user cannot change their answer.
    - Auto-advances to the next question after ~1.5 seconds, OR when the user clicks a "Next" button (whichever comes first).

- [ ] **9.3 Build the Fill-in-the-Blank quiz**
  - **File:** `src/components/QuizMode/FillInTheBlank.tsx`
  - **Acceptance Criteria:**
    - Displays a question prompt using the configured direction.
    - When direction is English → Yoruba, a **Character Picker** button is shown next to the text input.
    - Submitting via `Enter` or "Check" button evaluates the answer.
    - Evaluation is case-insensitive and trims leading/trailing whitespace.
    - If the user's answer matches the correct answer ignoring diacritics (but not exactly), the hint *"Almost! Check your tone marks."* is shown and the answer is marked wrong.
    - Pipe-delimited alternate answers in the `notes` field are all accepted as correct (§6.7.3).
    - Correct submission turns the input border green; wrong submission turns it red and reveals the correct answer.
    - Auto-advances after ~2 seconds or on "Next" button click.

- [ ] **9.4 Build the Quiz Session Summary screen**
  - **Acceptance Criteria:**
    - Displays score as "X / N — Y%".
    - Lists all incorrectly answered questions with the correct answers shown.
    - **"Retry Missed"** button restarts the quiz using only the missed questions.
    - **"New Quiz"** button returns to the Quiz Setup screen.
    - **"Go Home"** button navigates to `/`.
    - All quiz outcomes are recorded in `CardRecord` entries via `RECORD_OUTCOME`.
    - A `StudySession` entry with the correct `mode` (`'quiz-multiple-choice'` or `'quiz-fill-blank'`) is saved to `localStorage`.

---

## Phase 10 — Statistics Page

- [ ] **10.1 Build the KPI summary cards**
  - **File:** `src/pages/StatsPage.tsx`
  - **Acceptance Criteria:**
    - Displays all 6 metrics from §6.8.1 in a row of metric cards: Total Cards, Cards Studied, Total Sessions, Overall Accuracy, Cards Mastered, Cards to Revisit.
    - **Cards Mastered** uses the formula: `(timesCorrect / timesStudied) ≥ 0.8 AND timesStudied ≥ 3`.
    - **Overall Accuracy** = `(sum of all timesCorrect) / (sum of all timesStudied) × 100`, rounded to one decimal place.
    - On desktop, KPI cards are displayed in a multi-column grid; on mobile they stack.
    - All values reflect the current `localStorage` state and update without a page refresh.

- [ ] **10.2 Implement progress charts with Recharts**
  - **Acceptance Criteria:**
    - `recharts` is installed and listed in `package.json`.
    - **Accuracy Over Time** renders a `LineChart` plotting per-session accuracy (%) for the last 20 sessions; X-axis shows session date, Y-axis shows accuracy 0–100%.
    - **Study Activity** renders a `BarChart` showing the number of cards studied per day for the last 14 days; X-axis shows dates, Y-axis shows card count.
    - Both charts render without errors when there are 0 sessions (show an empty-state message instead of a broken chart).
    - Charts are responsive (use `ResponsiveContainer`) and render correctly at mobile widths.

- [ ] **10.3 Build the Card Performance sortable table**
  - **Acceptance Criteria:**
    - Displays a row for every card with columns: Yoruba, English, Times Studied, Times Correct, Times Wrong, Accuracy %, Last Studied.
    - Clicking a column header sorts the table by that column; clicking again reverses the sort direction. A visual sort indicator (↑/↓) is shown on the active column.
    - A search input above the table filters rows in real-time by Yoruba or English text.
    - Cards with zero study history show "—" for numeric/date fields.
    - The table is scrollable on mobile without horizontal overflow breaking the layout.

- [ ] **10.4 Implement "Reset All Progress" with confirmation**
  - **Acceptance Criteria:**
    - A **"Reset All Progress"** button at the bottom of the Stats page opens a confirmation dialog.
    - Confirming dispatches `RESET_ALL_PROGRESS`, which: clears all `CardRecord` entries, clears all `StudySession` entries, and sets `isMarkedWrong: false` on all cards.
    - User-created cards are **not** deleted after a reset.
    - After reset, all KPI cards show 0 or "—" and the charts show empty-state messages.
    - Cancelling the dialog produces no state change.

---

## Phase 11 — Settings

- [ ] **11.1 Build the Settings panel/page**
  - **Acceptance Criteria:**
    - Settings are accessible from the Navbar (e.g., a gear icon or dedicated `/settings` route).
    - **Speech toggle:** Enables/disables all TTS globally; dispatches `UPDATE_SETTINGS` with `speechEnabled`.
    - **Speech rate slider:** Range 0.5×–1.5×, step 0.05, default 0.85; dispatches `UPDATE_SETTINGS` with `speechRate` on change.
    - **Voice selector:** A dropdown populated with `availableVoices`; selecting a voice updates `settings.speechVoice`; only shown when `isSupported = true`.
    - **Auto-flip toggle:** Enables/disables automatic card flip; dispatches `UPDATE_SETTINGS` with `autoFlip`.
    - **Auto-flip delay:** A number input (seconds, min 1, max 10, default 3) enabled only when auto-flip is on; dispatches `UPDATE_SETTINGS` with `autoFlipDelay`.
    - All settings persist to `localStorage` and are restored on page reload.

---

## Phase 12 — Accessibility & Polish

- [ ] **12.1 Audit and complete ARIA labels across all interactive elements**
  - **Acceptance Criteria:**
    - Every button, link, and input has an accessible name via visible text, `aria-label`, or `aria-labelledby`.
    - Card flip announces the revealed content via `aria-live="polite"`.
    - Quiz answer feedback (correct/wrong) is announced via `aria-live="assertive"`.
    - All modals/dialogs have `role="dialog"`, `aria-modal="true"`, and a descriptive `aria-label`.
    - Running an automated accessibility audit tool (e.g., axe-core) on each page returns zero critical violations.

- [ ] **12.2 Implement full keyboard navigation**
  - **Acceptance Criteria:**
    - The entire app is navigable using only the keyboard (Tab, Shift+Tab, Enter, Space, Escape, Arrow keys).
    - Focus is never lost or trapped outside an intentional focus trap (e.g., modals).
    - All focus indicators are visible at all times (not suppressed by `outline: none` without a custom replacement).
    - The Character Picker supports arrow-key navigation between character buttons as specified in §6.3.2.

- [ ] **12.3 Implement dark mode and responsive design polish**
  - **Acceptance Criteria:**
    - The app respects the user's `prefers-color-scheme: dark` media query and applies a dark theme automatically.
    - All colour contrasts meet WCAG AA (4.5:1 for normal text, 3:1 for large text) in both light and dark modes.
    - Colour is never the sole indicator of quiz answer state (correct/wrong also shown via icon and text label, per §9.3 of the spec).
    - Assessment buttons in Study Mode are full-width and at least 48px tall on mobile (§9.2).
    - Card flip animation is suppressed via `@media (prefers-reduced-motion: reduce)`.

---

## Phase 13 — Error Handling & Edge Cases

- [ ] **13.1 Implement `localStorage` full / unavailable handling**
  - **Acceptance Criteria:**
    - When `saveState` catches a `QuotaExceededError`, a non-blocking toast notification appears: *"Progress could not be saved — storage is full."* (§10).
    - When `localStorage` is unavailable on mount, a persistent banner renders: *"Progress won't be saved in private browsing."* (§10).
    - The app remains fully functional in both error states; no unhandled exceptions propagate to the UI.
    - The banner and toast are distinct, accessible elements with appropriate ARIA roles (`role="alert"`).

- [ ] **13.2 Handle edge cases in Study and Quiz modes**
  - **Acceptance Criteria:**
    - If the deck has 0 active cards, `/study` and `/quiz` both render an empty-state UI with a call-to-action linking to `/cards`.
    - If fewer than 4 cards are available, the Multiple Choice quiz type is disabled on the setup screen with an explanatory message.
    - If `/study/redo` is accessed with 0 wrong cards, an empty-state message is shown.
    - If the Web Speech API is unavailable, all TTS speaker buttons are hidden (not just disabled) and a one-time notice is shown in Settings (§10).

---

## Phase 14 — Testing

- [ ] **14.1 Write unit tests for utilities and hooks**
  - **Acceptance Criteria:**
    - `shuffle.ts`: tests verify output length, all elements present, and statistical randomness (>5 distinct orderings over 100 runs).
    - `useLocalStorage`: tests verify read on mount, write persistence, default value fallback, and graceful handling of unavailable storage (using a mocked `localStorage`).
    - `useSpeech`: tests verify `speak` and `stop` call the correct methods on a mocked `window.speechSynthesis`.
    - `AppContext` reducer: every action type (`ADD_CARD`, `EDIT_CARD`, etc.) has at least one test verifying the correct state transition.
    - Fill-in-the-blank answer evaluator: tests cover case-insensitive match, exact diacritic match, diacritic-only mismatch (hint), pipe-delimited multi-answer acceptance, and whitespace trimming.
    - All tests pass with `npm run test` and coverage for the above files is ≥ 80%.

- [ ] **14.2 Write component tests with React Testing Library**
  - **Acceptance Criteria:**
    - `FlashCard`: renders Yoruba text on front, flips on click, shows assessment buttons only after flip, fires `onCorrect` and `onWrong` callbacks.
    - `CharacterPicker`: clicking a character button calls `onInsert` with the correct character; pressing `Escape` closes the panel.
    - Add/Edit card form: shows validation errors on empty submit; calls submit handler with correct data on valid input.
    - `StatsPage`: renders KPI values correctly calculated from mock `CardRecord` and `StudySession` data.
    - All component tests pass with `npm run test`.

- [ ] **14.3 (Optional) Write Playwright end-to-end tests**
  - **Acceptance Criteria:**
    - E2E test 1: Complete a 5-card study session from `/study` through to the Session Summary screen; verify correct/wrong counts match button presses.
    - E2E test 2: Add a custom card via `/cards`, navigate to `/study`, and verify the new card appears in the session.
    - E2E test 3: Complete a 5-question Multiple Choice quiz via `/quiz` and verify the score on the summary screen is accurate.
    - All three E2E tests pass with `npx playwright test` against a locally running dev server.

---

## Phase 15 — Performance & Build

- [ ] **15.1 Audit and optimise bundle size**
  - **Acceptance Criteria:**
    - Running `npm run build` completes without errors or TypeScript type errors.
    - The gzipped production bundle is under 300 KB (excluding fonts), as required by §11.
    - `vite-bundle-analyzer` (or equivalent) is used to identify and document any unexpectedly large dependencies.
    - Code-splitting is applied to page components (lazy-loaded routes) to reduce initial chunk size.

- [ ] **15.2 Validate animation performance**
  - **Acceptance Criteria:**
    - The card flip animation runs at a stable 60 fps on a mid-range mobile device (tested via Chrome DevTools Performance tab or equivalent).
    - No layout shifts (CLS) occur during the flip animation.
    - Page transition animations (if implemented) complete in ≤ 200ms.
    - The app achieves a Lighthouse Performance score ≥ 85 on mobile with cold-start load time < 2 seconds on simulated 4G (§11).

- [ ] **15.3 Write and finalise `README.md`**
  - **Acceptance Criteria:**
    - `README.md` documents: project overview, tech stack, local setup instructions (`npm install`, `npm run dev`), available scripts (`dev`, `build`, `test`, `lint`), and project structure summary.
    - Instructions are accurate and a fresh `git clone` + `npm install` + `npm run dev` works without additional steps.
    - Known limitations (no cloud sync, Yoruba TTS device-dependent) are noted.