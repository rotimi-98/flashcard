# Software Specification: Yoruba Flashcards Web Application

**Project Name:** Yoruba Flashcards  
**Version:** 1.0  
**Date:** April 6, 2026  
**Stack:** TypeScript, Vite, React  
**Author:** TBD  

---

## 1. Overview

Yoruba Flashcards is a browser-based language learning application that helps users study Yoruba vocabulary through interactive flashcards, quizzes, and progress tracking. The app targets beginners and intermediate learners and supports both a pre-loaded vocabulary set and user-created cards.

---

## 2. Goals & Scope

### 2.1 Goals

- Provide an intuitive flashcard-based interface for learning Yoruba vocabulary.
- Support card flip interactions, self-assessment, quiz modes, and performance statistics.
- Persist all user progress across browser sessions using browser storage (`localStorage`).
- Assist learners with Yoruba's unique tone marks via an on-screen character picker.
- Offer audio pronunciation via the Web Speech API (Text-to-Speech).

### 2.2 Out of Scope (v1.0)

- User accounts or cloud synchronisation
- Backend server or database
- Spaced repetition algorithm (SR)
- Multi-deck / category organisation
- Multiplayer or social features

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18+ |
| Language | TypeScript 5+ |
| Build Tool | Vite 5+ |
| Styling | CSS Modules or Tailwind CSS (team preference) |
| Storage | `localStorage` via a custom React hook |
| Audio | Web Speech API (`SpeechSynthesisUtterance`) |
| State Management | React Context + `useReducer` (no external library required) |
| Testing | Vitest + React Testing Library |
| Linting | ESLint + Prettier |

---

## 4. Application Architecture

### 4.1 Project Structure

```
yoruba-flashcards/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/                  # Static assets (icons, illustrations)
│   ├── components/              # Reusable UI components
│   │   ├── Card/
│   │   │   ├── FlashCard.tsx
│   │   │   └── FlashCard.module.css
│   │   ├── CharacterPicker/
│   │   │   ├── CharacterPicker.tsx
│   │   │   └── CharacterPicker.module.css
│   │   ├── QuizMode/
│   │   │   ├── MultipleChoice.tsx
│   │   │   └── FillInTheBlank.tsx
│   │   ├── Stats/
│   │   │   └── StatsPage.tsx
│   │   └── Layout/
│   │       ├── Navbar.tsx
│   │       └── Layout.tsx
│   ├── context/
│   │   └── AppContext.tsx        # Global state (cards, session, settings)
│   ├── hooks/
│   │   ├── useLocalStorage.ts   # Read/write localStorage with type safety
│   │   ├── useFlashcards.ts     # Card deck logic (shuffle, filter, redo)
│   │   ├── useSpeech.ts         # Web Speech API wrapper
│   │   └── useQuiz.ts           # Quiz mode logic
│   ├── data/
│   │   └── defaultCards.ts      # Pre-loaded Yoruba vocabulary dataset
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces & types
│   ├── utils/
│   │   ├── storage.ts           # localStorage serialisation helpers
│   │   └── shuffle.ts           # Fisher-Yates shuffle utility
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── StudyPage.tsx
│   │   ├── QuizPage.tsx
│   │   ├── ManageCardsPage.tsx
│   │   └── StatsPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 4.2 Routing

Client-side routing is handled with **React Router v6**. No server-side rendering is required.

| Route | Page Component | Description |
|---|---|---|
| `/` | `HomePage` | Landing screen with navigation to all modes |
| `/study` | `StudyPage` | Standard flashcard study mode |
| `/study/redo` | `StudyPage` | Study mode filtered to wrong cards only |
| `/quiz` | `QuizPage` | Quiz/Test mode (multiple choice or fill-in-the-blank) |
| `/cards` | `ManageCardsPage` | View, add, edit, and delete cards |
| `/stats` | `StatsPage` | Statistics and progress dashboard |

---

## 5. Data Model

### 5.1 Core Types (`src/types/index.ts`)

```typescript
/** A single flashcard entry */
export interface Flashcard {
  id: string;              // UUID (crypto.randomUUID())
  yoruba: string;          // Word or phrase in Yoruba (with tone marks)
  english: string;         // English translation
  notes?: string;          // Optional context or example sentence
  isPreloaded: boolean;    // true = came from defaultCards.ts; false = user-created
  createdAt: string;       // ISO 8601 timestamp
}

/** Per-card performance record stored in localStorage */
export interface CardRecord {
  cardId: string;
  timesStudied: number;
  timesCorrect: number;
  timesWrong: number;
  lastStudied: string;     // ISO 8601 timestamp
  isMarkedWrong: boolean;  // true = flagged for "redo wrong cards" session
}

/** Aggregated session statistics */
export interface StudySession {
  id: string;
  startedAt: string;
  endedAt?: string;
  mode: 'flashcard' | 'quiz-multiple-choice' | 'quiz-fill-blank' | 'redo-wrong';
  totalCards: number;
  correctCount: number;
  wrongCount: number;
}

/** Application settings */
export interface AppSettings {
  speechEnabled: boolean;
  speechRate: number;       // 0.5 – 2.0 (default: 0.85)
  speechVoice?: string;     // SpeechSynthesis voice name, if overridden
  autoFlip: boolean;        // Auto-flip card after N seconds (false by default)
  autoFlipDelay: number;    // Seconds before auto-flip (default: 3)
}

/** Root shape of localStorage state */
export interface PersistedState {
  cards: Flashcard[];
  records: CardRecord[];
  sessions: StudySession[];
  settings: AppSettings;
  schemaVersion: number;    // Increment when breaking changes are made to the shape
}
```

### 5.2 localStorage Schema

All persistent data is stored under a single key:

```
localStorage key: "yoruba_flashcards_v1"
value: JSON-serialised PersistedState
```

A `schemaVersion` field guards against stale data from older app versions. On app load, if the stored version does not match the current version constant, a migration function runs or the data is reset with a user-facing prompt.

---

## 6. Feature Specifications

---

### 6.1 Pre-Loaded Card Dataset

**File:** `src/data/defaultCards.ts`

The app ships with a minimum of **100 pre-loaded Yoruba–English vocabulary cards** covering practical beginner topics:

- Greetings and farewells
- Numbers (1–20)
- Days of the week
- Common nouns (people, food, animals, body parts)
- Common verbs (to go, to eat, to speak, to learn)
- Common adjectives (big, small, good, bad)

Each pre-loaded card has `isPreloaded: true`. Pre-loaded cards **cannot be deleted** by the user but can be hidden from the active deck via a toggle in the Manage Cards page.

---

### 6.2 Manage Cards Page

Users can create, edit, and delete their own custom cards.

#### 6.2.1 Add Card Form

- **Fields:**
  - `Yoruba` (required) — text input with an adjacent **Character Picker** button (see §6.3)
  - `English` (required) — plain text input
  - `Notes` (optional) — text area for example sentences or context
- **Validation:**
  - Both Yoruba and English fields must be non-empty before submission.
  - Duplicate Yoruba entries (case-insensitive, diacritic-insensitive) should warn the user but not block submission.
- **Submit:** Creates a new `Flashcard` object with a generated UUID and stores it in `localStorage`.

#### 6.2.2 Card List

- Displays all cards (pre-loaded and user-created) in a searchable, scrollable list.
- Each row shows: Yoruba word, English translation, a speaker icon (triggers TTS), an edit button, and a delete button.
- **Search:** A text input filters the list in real-time by Yoruba or English text.
- **Delete:** User-created cards show a delete button. Clicking it opens a confirmation dialog before removal.
- **Edit:** Opens the Add Card form pre-populated with the card's existing data.
- **Pre-loaded cards:** Show a lock icon instead of a delete button. The edit button is hidden.

---

### 6.3 Character Picker Component

Yoruba uses tone-marked characters that are difficult to type on a standard keyboard. The Character Picker provides an accessible, on-screen alternative.

#### 6.3.1 Supported Characters

The picker must include at minimum the following characters:

| Base | Low Tone | High Tone | Mid Tone | Notes |
|---|---|---|---|---|
| a | à | á | a | |
| e | è | é | e | |
| ẹ | ẹ̀ | ẹ́ | ẹ | Underdot variant |
| i | ì | í | i | |
| o | ò | ó | o | |
| ọ | ọ̀ | ọ́ | ọ | Underdot variant |
| u | ù | ú | u | |
| n | ǹ | ń | n | Syllabic nasal |
| s | — | — | ṣ | Underdot variant |

Both lowercase and uppercase variants must be included.

#### 6.3.2 Behaviour

- The picker appears as a **floating panel** anchored below the active text input.
- Clicking a character **inserts it at the cursor position** in the focused input field. It must not replace the entire field value.
- The panel can be dismissed by clicking outside it, pressing `Escape`, or clicking the picker toggle button again.
- The picker is accessible via keyboard: arrow keys navigate between characters, `Enter` inserts the focused character.
- ARIA roles: the panel has `role="dialog"` and a descriptive `aria-label`. Each character button has `aria-label` describing the character name (e.g., `"e with low tone"`).

---

### 6.4 Study Mode (Flashcard Mode)

**Route:** `/study`

#### 6.4.1 Session Initialisation

- On entering Study Mode, the app loads all active cards (non-hidden), shuffles them with a Fisher-Yates shuffle, and begins from card 1 of N.
- A progress indicator (e.g., "Card 3 of 45") is shown at the top of the screen.

#### 6.4.2 The Flashcard

- The card face shows the **Yoruba word** in large, prominent typography.
- A **speaker icon** button appears on the card face. Clicking it calls the TTS engine (see §6.6) to pronounce the Yoruba word.
- The card has a visible **"Tap to flip"** affordance (e.g., a subtle label or chevron icon).

#### 6.4.3 Card Flip

- Clicking/tapping the card triggers a **CSS 3D flip animation** (Y-axis rotation, ~300ms).
- The back of the card reveals:
  - The **English translation** in large text.
  - The **Notes** field (if present) in smaller, muted text.
  - A speaker icon that reads the English translation aloud via TTS.
- After the flip, two assessment buttons appear **below the card**:
  - ✅ **"Got it"** (green) — marks the card as correct for this session.
  - ❌ **"Still learning"** (red/orange) — marks the card as wrong and flags `isMarkedWrong: true` on its `CardRecord`.

#### 6.4.4 Navigation

- After pressing either button, the deck automatically advances to the next card.
- Navigation arrows (previous / next) are available so users can manually skip or go back. Going back does not re-record the previous card's outcome; the recorded outcome stands.
- On reaching the last card, the session ends and a **Session Summary screen** is shown (see §6.4.5).

#### 6.4.5 Session Summary Screen

Displayed after completing a study session:

- Total cards reviewed
- Number correct (✅) and wrong (❌)
- Percentage correct
- A **"Redo Wrong Cards"** button (visible only if ≥ 1 card was marked wrong) — navigates to `/study/redo`
- A **"Study Again"** button (reshuffles all active cards and restarts)
- A **"Go Home"** button

---

### 6.5 Redo Wrong Cards Mode

**Route:** `/study/redo`

- Behaves identically to standard Study Mode (§6.4) with one difference: the deck is pre-filtered to only cards where `isMarkedWrong: true`.
- If the user marks a wrong card as ✅ "Got it" during a redo session, `isMarkedWrong` is set to `false` for that card.
- If the user marks a card ❌ again, `isMarkedWrong` remains `true`.
- After completing the redo session, the Session Summary screen shows updated counts and another "Redo Wrong Cards" option if any cards are still marked wrong.
- Accessible from: the Session Summary screen, and the Home Page if wrong cards exist.

---

### 6.6 Text-to-Speech (TTS)

**Hook:** `src/hooks/useSpeech.ts`

#### 6.6.1 Engine

The app uses the browser's native **Web Speech API** (`window.speechSynthesis`). No third-party audio files are required.

```typescript
// Pseudocode for useSpeech hook
const speak = (text: string, lang: 'yo' | 'en-US') => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;        // 'yo' for Yoruba, 'en-US' for English
  utterance.rate = settings.speechRate;
  if (settings.speechVoice) {
    utterance.voice = getVoiceByName(settings.speechVoice);
  }
  window.speechSynthesis.cancel();   // Cancel any in-progress utterance
  window.speechSynthesis.speak(utterance);
};
```

#### 6.6.2 Language Tag

- Yoruba pronunciation uses the BCP 47 language tag **`yo`**.
- Note: Not all browsers ship with a Yoruba voice. If no `yo` voice is available, the app falls back to a neutral voice and shows an **informational banner** explaining that a Yoruba voice is not installed on the user's device, with guidance to check system TTS settings.

#### 6.6.3 Controls

- A global **TTS toggle** in the app Settings disables all speech (`settings.speechEnabled = false`).
- When TTS is disabled, speaker icon buttons are greyed out and non-interactive.
- Speech rate is user-configurable via a slider (range: 0.5×–1.5×) in Settings.

#### 6.6.4 Accessibility

- All speaker icon buttons have `aria-label="Pronounce [word]"`.
- When speech is actively playing, the button shows an animated waveform icon (or changes to a "stop" icon) and has `aria-busy="true"`.

---

### 6.7 Quiz / Test Mode

**Route:** `/quiz`

The Quiz Mode presents cards in test form rather than as free-study flashcards. Users select a quiz type before the session begins.

#### 6.7.1 Quiz Setup Screen

Before starting, the user configures:

- **Quiz Type:** Multiple Choice or Fill-in-the-Blank
- **Direction:** Yoruba → English (default) or English → Yoruba
- **Number of Questions:** 5, 10, 20, or All cards
- A **Start Quiz** button begins the session.

#### 6.7.2 Multiple Choice

- A question prompt is shown (e.g., "What does **ẹ jẹ** mean in English?").
- Four answer options are displayed as buttons (1 correct + 3 distractors drawn randomly from the deck).
- Distractors are selected to avoid being semantically identical to the correct answer.
- **On selection:**
  - Correct answer: button turns green, brief positive feedback label appears.
  - Wrong answer: selected button turns red, the correct answer is highlighted green.
  - A TTS speaker icon next to the prompt lets users hear the Yoruba word.
- After feedback (~ 1.5 seconds auto-advance, or manual "Next" button), the next question appears.
- There is no ability to change an answer once selected.

#### 6.7.3 Fill-in-the-Blank

- A question prompt is shown (e.g., "Type the English meaning of: **ẹ jẹ**").
- A text input is presented. When the direction is **English → Yoruba**, a **Character Picker** button is shown next to the input (see §6.3).
- **Submission:** User presses `Enter` or clicks a "Check" button.
- **Answer Evaluation:**
  - Comparison is **case-insensitive** and **leading/trailing whitespace is trimmed**.
  - Tone marks are **required** when the expected answer is in Yoruba (direction: English → Yoruba). However, the system shows a hint message if the user's answer matches ignoring diacritics but not exactly: *"Almost! Check your tone marks."*
  - Multiple accepted English answers can be stored in a card's `notes` field as a pipe-delimited string (e.g., `to go|to leave`); the evaluator accepts any match.
- **On submission:**
  - Correct: input border turns green, feedback label shown.
  - Wrong: input border turns red, the correct answer is revealed.
- Auto-advances after ~2 seconds or manual "Next" button click.

#### 6.7.4 Quiz Session Summary

After all questions are answered, the summary screen shows:

- Score (e.g., "8 / 10 — 80%")
- List of incorrectly answered questions with the correct answers shown.
- **"Retry Missed"** button — restarts the quiz with only the missed questions.
- **"New Quiz"** button — returns to the Quiz Setup screen.
- **"Go Home"** button.
- All quiz outcomes are recorded into `CardRecord` and a `StudySession` is saved to `localStorage`.

---

### 6.8 Statistics Page

**Route:** `/stats`

The Statistics Page gives users a birds-eye view of their learning progress.

#### 6.8.1 Summary KPIs

Displayed as a row of metric cards at the top:

| Metric | Description |
|---|---|
| Total Cards | Total number of cards in the deck (pre-loaded + user-created) |
| Cards Studied | Number of distinct cards studied at least once |
| Total Sessions | Cumulative number of study/quiz sessions completed |
| Overall Accuracy | (Total correct ÷ Total attempts) × 100, across all sessions |
| Cards Mastered | Cards where (timesCorrect / timesStudied) ≥ 0.8 AND timesStudied ≥ 3 |
| Cards to Revisit | Cards currently flagged as `isMarkedWrong: true` |

#### 6.8.2 Progress Charts

- **Accuracy Over Time** — A line chart plotting per-session accuracy (%) across the user's last 20 sessions. X-axis: session date. Y-axis: accuracy %.
- **Study Activity** — A bar chart showing the number of cards studied per day over the last 14 days.

Charts are rendered using **Recharts** (React-native, TypeScript-friendly, no canvas dependency issues).

#### 6.8.3 Card Performance Table

A sortable table listing every card with:

- Yoruba word
- English translation
- Times studied
- Times correct
- Times wrong
- Accuracy % (calculated)
- Last studied date

Columns are sortable (ascending/descending) by clicking the column header. A search box filters rows by Yoruba or English text.

#### 6.8.4 Reset Progress

A **"Reset All Progress"** button at the bottom of the page opens a confirmation dialog. On confirmation:

- All `CardRecord` entries are cleared.
- All `StudySession` entries are cleared.
- `isMarkedWrong` is reset to `false` on all cards.
- User-created cards are **not** deleted.

---

## 7. Component Specifications

### 7.1 `FlashCard` Component

```typescript
interface FlashCardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  onCorrect: () => void;
  onWrong: () => void;
  onSpeak: (text: string, lang: 'yo' | 'en-US') => void;
  isSpeaking: boolean;
}
```

- The component manages only **visual state** (flip CSS class toggle). Business logic lives in `useFlashcards`.
- The flip animation uses CSS `transform: rotateY(180deg)` with `backface-visibility: hidden` on front and back faces. The front face has `z-index` priority when `isFlipped = false` and vice versa.
- Assessment buttons (`onCorrect` / `onWrong`) are hidden until `isFlipped = true`.

### 7.2 `CharacterPicker` Component

```typescript
interface CharacterPickerProps {
  targetRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  onInsert: (char: string) => void;
}
```

- `targetRef` points to the input the picker is attached to.
- `onInsert` inserts the character at the current cursor selection range using `setSelectionRange`.

### 7.3 `useLocalStorage` Hook

```typescript
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]
```

- Wraps `localStorage.getItem` / `setItem` with JSON serialisation.
- Returns a state value and a setter that updates both React state and `localStorage` atomically.
- Handles `localStorage` unavailability gracefully (private browsing) by falling back to in-memory state and logging a warning.

### 7.4 `useSpeech` Hook

```typescript
interface UseSpeechReturn {
  speak: (text: string, lang: 'yo' | 'en-US') => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
}

function useSpeech(settings: AppSettings): UseSpeechReturn
```

- `isSupported` is `false` when `window.speechSynthesis` is undefined (non-supporting browser). All speak buttons are disabled when `isSupported = false`.
- `availableVoices` is populated after the `voiceschanged` event fires (required for Chrome).

---

## 8. State Management

Global state is provided by a React Context (`AppContext`) backed by a `useReducer` pattern. The reducer handles the following action types:

| Action | Description |
|---|---|
| `ADD_CARD` | Adds a new user-created card |
| `EDIT_CARD` | Updates fields of an existing card |
| `DELETE_CARD` | Removes a user-created card by ID |
| `RECORD_OUTCOME` | Updates a card's `CardRecord` (correct/wrong) |
| `START_SESSION` | Creates a new `StudySession` entry |
| `END_SESSION` | Marks the active session as ended |
| `RESET_WRONG_FLAGS` | Clears `isMarkedWrong` on specified card IDs |
| `RESET_ALL_PROGRESS` | Clears all records and sessions |
| `UPDATE_SETTINGS` | Updates one or more `AppSettings` fields |
| `LOAD_STATE` | Hydrates state from `localStorage` on app init |

Every dispatch that mutates state also triggers a `localStorage` write via a `useEffect` that watches state changes.

---

## 9. UI & Design Guidelines

### 9.1 Tone & Aesthetic

The app should feel **calm, modern, and educational** — not childish or overly gamified. The visual language should support focus and readability.

- **Colour palette:** Warm neutral surfaces with a single teal or green accent (aligned with the Nexus design palette). Light and dark mode are both supported.
- **Typography:** A clean sans-serif body font (e.g., Satoshi or General Sans via Fontshare). Yoruba text should render at a larger size to make tone marks clearly legible.
- **Card design:** Cards use a slight drop shadow and rounded corners. The Yoruba face has a subtle warm tint to differentiate it from the English face.
- **Motion:** Smooth, purposeful transitions (card flip ~300ms, page transitions ~200ms). Respect `prefers-reduced-motion`.

### 9.2 Responsiveness

The app must work well at all screen sizes:

- **Mobile (375px+):** Single-column layout. Card fills most of the viewport width. Assessment buttons are full-width and thumb-friendly (min-height: 48px).
- **Tablet (768px+):** Centred card with comfortable side margins.
- **Desktop (1024px+):** Card is constrained to a max width of ~480px, centred on screen. Stats page uses a multi-column grid for KPI cards.

### 9.3 Accessibility

- Full keyboard navigation throughout.
- All interactive elements have accessible names (via `aria-label` or visible text).
- Focus indicators are visible at all times.
- Screen reader announcements on card flip (`aria-live="polite"`) and quiz answer feedback.
- Colour is never the only indicator of state (wrong/correct also shown via icon and text).

---

## 10. Error Handling & Edge Cases

| Scenario | Handling |
|---|---|
| `localStorage` is full | Catch `QuotaExceededError`; show a toast warning the user that progress could not be saved |
| `localStorage` unavailable (private mode) | Fall back to in-memory state; show a persistent banner: *"Progress won't be saved in private browsing."* |
| No Yoruba TTS voice available | Show informational banner; speech still works with default voice |
| Deck has fewer than 4 cards | Multiple Choice quiz is disabled with an explanation message |
| Deck has 0 cards | Study and Quiz modes show an empty state with a prompt to add cards |
| `schemaVersion` mismatch on load | Show a dialog: *"Your saved data is from an older version. Reset and start fresh?"* with Confirm/Cancel |
| Browser does not support Web Speech API | All TTS buttons are hidden; a one-time notice is shown in Settings |

---

## 11. Performance Requirements

- Initial page load (cold start): **< 2 seconds** on a modern device on 4G.
- Card flip animation: **≤ 300ms**, no jank. Must pass 60fps on mid-range mobile.
- `localStorage` read/write: Must complete synchronously within the current render cycle. No async storage calls.
- Bundle size target: **< 300KB gzipped** (excluding fonts).

---

## 12. Testing Plan

### 12.1 Unit Tests (Vitest)

- `shuffle.ts`: verify output length equals input length, all elements present, order differs from input.
- `useLocalStorage`: verify read, write, and default value behaviour with a mocked `localStorage`.
- `useSpeech`: verify `speak` and `stop` calls on a mocked `window.speechSynthesis`.
- `AppContext` reducer: test each action type for correct state transitions.
- Answer evaluator (fill-in-the-blank): test case-insensitive matching, diacritic-only mismatch hint, multi-answer pipe matching.

### 12.2 Component Tests (React Testing Library)

- `FlashCard`: renders Yoruba text, flips on click, shows buttons after flip, fires `onCorrect` / `onWrong`.
- `CharacterPicker`: inserts character at cursor on button click, dismisses on Escape.
- `AddCardForm`: validates required fields, fires submit with correct data.
- `StatsPage`: renders KPI cards with correct calculated values from mock data.

### 12.3 End-to-End Tests (Playwright, optional for v1.0)

- Complete a 5-card study session from start to session summary.
- Add a custom card and verify it appears in the deck.
- Complete a multiple-choice quiz and verify score display.

---

## 13. Future Considerations (v2.0+)

These features are explicitly out of scope for v1.0 but should be kept in mind to avoid architectural decisions that block them later:

- **Spaced Repetition (SM-2 algorithm):** The `CardRecord` schema already stores `timesStudied`, `timesCorrect`, and `lastStudied`, making this a straightforward future addition.
- **Deck Categories:** The `Flashcard` type can be extended with a `deckId` field without breaking existing records.
- **Cloud Sync / User Accounts:** The `useLocalStorage` hook can be abstracted behind a `useStorage` interface and swapped for an API-backed implementation.
- **Community Card Packs:** Pre-built topic packs (e.g., Medical Yoruba, Business Yoruba) importable as JSON.
- **Audio Recordings:** Replace TTS with recorded native-speaker audio files per card.
- **Leaderboards / Streaks:** Gamification layer on top of the existing `StudySession` history.

---

*End of Specification — Version 1.0*
