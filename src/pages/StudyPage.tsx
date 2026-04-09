import { useCallback, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FlashCard } from '../components/Card/FlashCard.tsx'
import { useApp } from '../context/useApp.ts'
import { useFlashcards } from '../hooks/useFlashcards.ts'
import { useSpeech } from '../hooks/useSpeech.ts'
import styles from './StudyPage.module.css'
import shell from './pageShell.module.css'

export function StudyPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isRedo = pathname.endsWith('/redo')
  const { dispatch, state } = useApp()
  const { speak, isSpeaking, isSupported: speechSupported } = useSpeech(state.settings)

  const {
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    isAssessed,
    isSessionComplete,
    correctCount,
    wrongCount,
    flip,
    goNext,
    goPrev,
    markCorrect,
    markWrong,
    restart,
  } = useFlashcards(isRedo)

  // Track the active session id so we can end it on completion.
  const sessionIdRef = useRef<string | null>(null)

  // Dispatch START_SESSION once on mount (only if there are cards).
  useEffect(() => {
    if (totalCards === 0) return
    const id = crypto.randomUUID()
    sessionIdRef.current = id
    dispatch({
      type: 'START_SESSION',
      payload: {
        id,
        startedAt: new Date().toISOString(),
        mode: isRedo ? 'redo-wrong' : 'flashcard',
        totalCards,
        correctCount: 0,
        wrongCount: 0,
      },
    })
    // Only run on initial mount — the session starts once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // End the session when all cards have been assessed.
  useEffect(() => {
    if (!isSessionComplete || !sessionIdRef.current) return
    dispatch({
      type: 'END_SESSION',
      payload: {
        id: sessionIdRef.current,
        correctCount,
        wrongCount,
      },
    })
  }, [isSessionComplete, dispatch, correctCount, wrongCount])

  const hasWrongCards = state.records.some((r) => r.isMarkedWrong)

  const startNewSession = useCallback(
    (mode: 'flashcard' | 'redo-wrong') => {
      const newTotal = restart()
      if (newTotal === 0) return
      const id = crypto.randomUUID()
      sessionIdRef.current = id
      dispatch({
        type: 'START_SESSION',
        payload: {
          id,
          startedAt: new Date().toISOString(),
          mode,
          totalCards: newTotal,
          correctCount: 0,
          wrongCount: 0,
        },
      })
    },
    [dispatch, restart],
  )

  const handleStudyAgain = useCallback(
    () => startNewSession(isRedo ? 'redo-wrong' : 'flashcard'),
    [startNewSession, isRedo],
  )

  const handleRedoWrong = useCallback(() => {
    if (isRedo) {
      startNewSession('redo-wrong')
    } else {
      navigate('/study/redo')
    }
  }, [isRedo, startNewSession, navigate])

  // Empty deck state.
  if (totalCards === 0) {
    return (
      <div className={shell.wrap}>
        <div className={styles.empty}>
          <h1 className={styles.emptyTitle}>
            {isRedo ? 'No cards to redo!' : 'No cards to study'}
          </h1>
          <p className={styles.emptyText}>
            {isRedo
              ? "Great work — you don't have any wrong cards to review."
              : 'Add some vocabulary to get started.'}
          </p>
          <Link
            to={isRedo ? '/study' : '/cards'}
            className={styles.emptyLink}
          >
            {isRedo ? 'Study all cards' : 'Manage cards'}
          </Link>
        </div>
      </div>
    )
  }

  // Session Summary screen.
  if (isSessionComplete) {
    const total = correctCount + wrongCount
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0

    return (
      <div className={styles.container}>
        <div className={styles.summary}>
          <h1 className={styles.summaryTitle}>Session complete!</h1>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{total}</span>
              <span className={styles.statLabel}>Cards</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statCorrect}`}>
                {correctCount}
              </span>
              <span className={styles.statLabel}>Correct</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statWrong}`}>
                {wrongCount}
              </span>
              <span className={styles.statLabel}>Wrong</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statPct}`}>
                {pct}%
              </span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
          </div>

          <div className={styles.summaryActions}>
            {hasWrongCards && (
              <button
                type="button"
                className={`${styles.summaryBtn} ${styles.redoBtn}`}
                onClick={handleRedoWrong}
              >
                Redo wrong cards
              </button>
            )}
            <button
              type="button"
              className={styles.summaryBtn}
              onClick={handleStudyAgain}
            >
              Study again
            </button>
            <Link to="/" className={styles.summaryBtn}>
              Go home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Active study session.
  const progressPct =
    totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>
        {isRedo ? 'Redo wrong cards' : 'Study mode'}
      </h1>

      <div className={styles.progress}>
        <p className={styles.progressText}>
          Card {currentIndex + 1} of {totalCards}
        </p>
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalCards}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {currentCard && (
        <FlashCard
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={flip}
          onCorrect={markCorrect}
          onWrong={markWrong}
          onSpeak={speak}
          isSpeaking={isSpeaking}
          hideActions={isAssessed}
          speechDisabled={!state.settings.speechEnabled}
          speechSupported={speechSupported}
        />
      )}

      <nav className={styles.nav} aria-label="Card navigation">
        <button
          type="button"
          className={styles.navBtn}
          onClick={goPrev}
          disabled={currentIndex <= 0}
          aria-label="Previous card"
        >
          ← Prev
        </button>
        <button
          type="button"
          className={styles.navBtn}
          onClick={goNext}
          disabled={currentIndex + 1 >= totalCards}
          aria-label="Next card"
        >
          Next →
        </button>
      </nav>
    </div>
  )
}
