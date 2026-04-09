/**
 * Strip combining diacritical marks (tone marks, underdots) from a string.
 * Used to detect "almost correct" answers that only differ by diacritics.
 */
function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f\u0323]/g, '')
}

/**
 * Parse pipe-delimited alternate answers from a card's notes field.
 * e.g. "to go|to leave" → ["to go", "to leave"]
 */
export function parseAlternates(notes: string | undefined): string[] {
  if (!notes) return []
  return notes
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface EvalResult {
  isCorrect: boolean
  /** Shown when the answer matches ignoring diacritics but not exactly. */
  hint?: string
}

/**
 * Evaluates a user's quiz answer against the correct answer and any
 * pipe-delimited alternates from the card's notes field.
 *
 * - Case-insensitive, leading/trailing whitespace trimmed.
 * - If the answer matches stripped of diacritics but not exactly,
 *   returns a hint: "Almost! Check your tone marks."
 */
export function evaluateAnswer(
  userInput: string,
  correctAnswer: string,
  alternates: string[],
): EvalResult {
  const input = userInput.trim()
  const candidates = [correctAnswer, ...alternates]

  for (const candidate of candidates) {
    if (input.toLowerCase() === candidate.toLowerCase()) {
      return { isCorrect: true }
    }
  }

  for (const candidate of candidates) {
    if (
      stripDiacritics(input).toLowerCase() ===
      stripDiacritics(candidate).toLowerCase()
    ) {
      return { isCorrect: false, hint: 'Almost! Check your tone marks.' }
    }
  }

  return { isCorrect: false }
}
