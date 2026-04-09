import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Flashcard } from '../../types/index.ts'
import type { QuizQuestion, QuizResult } from '../../types/quiz.ts'
import { fisherYatesShuffle } from '../../utils/shuffle.ts'
import styles from './MultipleChoice.module.css'

interface MultipleChoiceProps {
  question: QuizQuestion
  allCards: Flashcard[]
  direction: 'yo-en' | 'en-yo'
  onAnswer: (result: QuizResult) => void
  onSpeak: (text: string, lang: 'yo' | 'en-US') => void
  isSpeaking: boolean
  speechDisabled: boolean
  speechSupported: boolean
}

/**
 * Renders a single multiple-choice question with 4 options
 * (1 correct + 3 distractors), feedback colouring, and auto-advance.
 */
export function MultipleChoice({
  question,
  allCards,
  direction,
  onAnswer,
  onSpeak,
  isSpeaking,
  speechDisabled,
  speechSupported,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const options = useMemo(() => {
    const answerField = direction === 'yo-en' ? 'english' : 'yoruba'
    const correct = question.correctAnswer

    const distractorPool = allCards
      .filter((c) => c.id !== question.card.id)
      .map((c) => c[answerField])
      .filter((v) => v.toLowerCase() !== correct.toLowerCase())

    const shuffledPool = fisherYatesShuffle(distractorPool)
    const distractors = shuffledPool.slice(0, 3)

    return fisherYatesShuffle([correct, ...distractors])
  }, [question, allCards, direction])

  const handleSelect = useCallback(
    (opt: string) => {
      if (answered) return
      setSelected(opt)
      setAnswered(true)

      const isCorrect =
        opt.toLowerCase() === question.correctAnswer.toLowerCase()

      timerRef.current = setTimeout(() => {
        onAnswer({
          card: question.card,
          userAnswer: opt,
          correctAnswer: question.correctAnswer,
          isCorrect,
        })
      }, 1500)
    },
    [answered, question, onAnswer],
  )

  const handleNext = useCallback(() => {
    if (!answered) return
    if (timerRef.current) clearTimeout(timerRef.current)
    const isCorrect =
      (selected ?? '').toLowerCase() === question.correctAnswer.toLowerCase()
    onAnswer({
      card: question.card,
      userAnswer: selected ?? '',
      correctAnswer: question.correctAnswer,
      isCorrect,
    })
  }, [answered, selected, question, onAnswer])

  // Cleanup timer on unmount.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const yorubaWord =
    direction === 'yo-en' ? question.card.yoruba : question.card.english

  const isCorrectSelection =
    selected?.toLowerCase() === question.correctAnswer.toLowerCase()

  return (
    <div className={styles.wrapper}>
      <p className={styles.prompt}>
        {direction === 'yo-en'
          ? 'What does '
          : 'What is the Yoruba word for '}
        <span className={styles.promptWord}>{question.prompt}</span>
        {direction === 'yo-en' ? ' mean?' : '?'}
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

      <div className={styles.options}>
        {options.map((opt) => {
          let cls = styles.optBtn
          if (answered) {
            if (opt.toLowerCase() === question.correctAnswer.toLowerCase()) {
              cls += ` ${styles.optCorrect}`
            } else if (opt === selected) {
              cls += ` ${styles.optWrong}`
            }
          }

          return (
            <button
              key={opt}
              type="button"
              className={cls}
              onClick={() => handleSelect(opt)}
              disabled={answered}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <>
          <p
            className={`${styles.feedback} ${isCorrectSelection ? styles.feedbackCorrect : styles.feedbackWrong}`}
          >
            {isCorrectSelection ? 'Correct!' : `The answer is: ${question.correctAnswer}`}
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
    </div>
  )
}
