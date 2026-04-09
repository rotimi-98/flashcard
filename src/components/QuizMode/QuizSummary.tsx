import { Link } from 'react-router-dom'
import type { QuizResult } from '../../types/quiz.ts'
import styles from './QuizSummary.module.css'

interface QuizSummaryProps {
  results: QuizResult[]
  onRetryMissed: () => void
  onNewQuiz: () => void
}

export function QuizSummary({
  results,
  onRetryMissed,
  onNewQuiz,
}: QuizSummaryProps) {
  const total = results.length
  const correct = results.filter((r) => r.isCorrect).length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const missed = results.filter((r) => !r.isCorrect)

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Quiz complete!</h1>
      <p className={styles.score}>
        {correct} / {total} — {pct}%
      </p>

      {missed.length > 0 && (
        <div className={styles.missedSection}>
          <h2 className={styles.missedHeading}>Missed questions</h2>
          <div className={styles.missedList} role="list">
            {missed.map((r, i) => (
              <div key={i} className={styles.missedItem} role="listitem">
                <span className={styles.missedQ}>
                  {r.card.yoruba} — {r.card.english}
                </span>
                <span className={styles.missedA}>→ {r.correctAnswer}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {missed.length > 0 && (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.retryBtn}`}
            onClick={onRetryMissed}
          >
            Retry missed
          </button>
        )}
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onNewQuiz}
        >
          New quiz
        </button>
        <Link to="/" className={styles.actionBtn}>
          Go home
        </Link>
      </div>
    </div>
  )
}
