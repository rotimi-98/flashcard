import { Link } from 'react-router-dom'
import { useApp } from '../context/useApp.ts'
import styles from './HomePage.module.css'

export function HomePage() {
  const { state } = useApp()
  const hasWrongCards = state.records.some((r) => r.isMarkedWrong)

  return (
    <div>
      <header className={styles.hero}>
        <h1 className={styles.title}>Yoruba Flashcards</h1>
        <p className={styles.subtitle}>
          Learn Yoruba vocabulary with flashcards, quizzes, and progress saved
          in your browser—no account required.
        </p>
      </header>

      <div className={styles.grid}>
        <Link to="/study" className={`${styles.card} ${styles.cardStudy}`}>
          <span className={styles.cardTitle}>Study</span>
          <p className={styles.cardDesc}>
            Flip through cards, listen to pronunciation, and mark what you know.
          </p>
        </Link>
        <Link to="/quiz" className={`${styles.card} ${styles.cardQuiz}`}>
          <span className={styles.cardTitle}>Quiz</span>
          <p className={styles.cardDesc}>
            Test yourself with multiple choice or fill-in-the-blank questions.
          </p>
        </Link>
        <Link to="/cards" className={`${styles.card} ${styles.cardManage}`}>
          <span className={styles.cardTitle}>Manage cards</span>
          <p className={styles.cardDesc}>
            Browse the deck, add your own words, and search the list.
          </p>
        </Link>
        {hasWrongCards && (
          <Link
            to="/study/redo"
            className={`${styles.card} ${styles.redo}`}
          >
            <span className={styles.cardTitle}>Redo wrong cards</span>
            <p className={styles.cardDesc}>
              Review only the cards you marked as still learning.
            </p>
          </Link>
        )}
      </div>
    </div>
  )
}
