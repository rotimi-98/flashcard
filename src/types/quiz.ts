import type { Flashcard } from './index.ts'

export type QuizType = 'multiple-choice' | 'fill-blank'
export type QuizDirection = 'yo-en' | 'en-yo'
export type QuestionCount = 5 | 10 | 20 | 'all'

export interface QuizConfig {
  type: QuizType
  direction: QuizDirection
  questionCount: QuestionCount
}

export interface QuizQuestion {
  card: Flashcard
  /** The text shown as the question prompt. */
  prompt: string
  /** The expected correct answer. */
  correctAnswer: string
  /** Additional accepted answers parsed from the card's notes. */
  alternates: string[]
}

export interface QuizResult {
  card: Flashcard
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  hint?: string
}
