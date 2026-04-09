import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { CharacterPicker } from '../CharacterPicker/CharacterPicker.tsx'
import type { QuizQuestion, QuizResult } from '../../types/quiz.ts'
import { evaluateAnswer, parseAlternates } from '../../utils/answerEval.ts'
import styles from './FillInTheBlank.module.css'

interface FillInTheBlankProps {
  question: QuizQuestion
  direction: 'yo-en' | 'en-yo'
  onAnswer: (result: QuizResult) => void
  onSpeak: (text: string, lang: 'yo' | 'en-US') => void
  isSpeaking: boolean
  speechDisabled: boolean
  speechSupported: boolean
}

/**
 * Renders a single fill-in-the-blank question with text input,
 * optional CharacterPicker (for English → Yoruba), and auto-advance.
 */
export function FillInTheBlank({
  question,
  direction,
  onAnswer,
  onSpeak,
  isSpeaking,
  speechDisabled,
  speechSupported,
}: FillInTheBlankProps) {
  const [value, setValue] = useState('')
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [hint, setHint] = useState<string | undefined>()
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showPicker = direction === 'en-yo'

  const submit = useCallback(() => {
    if (answered || !value.trim()) return

    const alternates = parseAlternates(question.card.notes)
    const result = evaluateAnswer(value, question.correctAnswer, alternates)

    setAnswered(true)
    setIsCorrect(result.isCorrect)
    setHint(result.hint)

    timerRef.current = setTimeout(() => {
      onAnswer({
        card: question.card,
        userAnswer: value.trim(),
        correctAnswer: question.correctAnswer,
        isCorrect: result.isCorrect,
        hint: result.hint,
      })
    }, 2000)
  }, [answered, value, question, onAnswer])

  const handleNext = useCallback(() => {
    if (!answered) return
    if (timerRef.current) clearTimeout(timerRef.current)
    onAnswer({
      card: question.card,
      userAnswer: value.trim(),
      correctAnswer: question.correctAnswer,
      isCorrect,
      hint,
    })
  }, [answered, value, question, onAnswer, isCorrect, hint])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit()
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [question.card.id])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const yorubaWord =
    direction === 'yo-en' ? question.card.yoruba : question.card.english

  let inputCls = styles.input
  if (answered) {
    inputCls += ` ${isCorrect ? styles.inputCorrect : styles.inputWrong}`
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.prompt}>
        {direction === 'yo-en'
          ? 'Type the English meaning of: '
          : 'Type the Yoruba word for: '}
        <span className={styles.promptWord}>{question.prompt}</span>
        {speechSupported && (
          <button
            type="button"
            className={styles.speakBtn}
            onClick={() => onSpeak(yorubaWord, 'yo')}
            disabled={speechDisabled}
            aria-label={`Pronounce ${yorubaWord}`}
            aria-busy={isSpeaking}
          >
            {isSpeaking ? '⏹️' : '🔊'}
          </button>
        )}
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            className={inputCls}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={answered}
            aria-label="Your answer"
            autoComplete="off"
          />
          {showPicker && !answered && (
            <CharacterPicker
              targetRef={inputRef}
              onInsert={() => {}}
            />
          )}
          {!answered && (
            <button
              type="submit"
              className={styles.checkBtn}
              disabled={!value.trim()}
            >
              Check
            </button>
          )}
        </div>

        {answered && (
          <>
            {hint && <p className={styles.hint} aria-live="assertive">{hint}</p>}
            <p
              className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}
              aria-live="assertive"
            >
              {isCorrect
                ? 'Correct!'
                : `The answer is: ${question.correctAnswer}`}
            </p>
            <button
              type="button"
              className={styles.nextBtn}
              onClick={handleNext}
            >
              Next →
            </button>
          </>
        )}
      </form>
    </div>
  )
}
