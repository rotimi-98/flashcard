import type { Flashcard } from '../../types/index.ts'
import styles from './FlashCard.module.css'

export interface FlashCardProps {
  card: Flashcard
  isFlipped: boolean
  onFlip: () => void
  onCorrect: () => void
  onWrong: () => void
  onSpeak: (text: string, lang: 'yo' | 'en-US') => void
  isSpeaking: boolean
  /** Hide assessment buttons when the card has already been assessed. */
  hideActions?: boolean
}

/**
 * A two-faced flashcard with a CSS 3D flip animation.
 * Front shows the Yoruba word; back shows the English translation.
 * Assessment buttons appear below the card only after flipping.
 */
export function FlashCard({
  card,
  isFlipped,
  onFlip,
  onCorrect,
  onWrong,
  onSpeak,
  isSpeaking,
  hideActions = false,
}: FlashCardProps) {
  const showActions = isFlipped && !hideActions

  return (
    <>
      <div className={styles.scene}>
        <div
          className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
          onClick={onFlip}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onFlip()
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={
            isFlipped
              ? `Flashcard showing: ${card.english}. Click to flip back.`
              : `Flashcard: tap to reveal translation`
          }
        >
          {/* Front face — Yoruba */}
          <div className={`${styles.face} ${styles.front}`}>
            <button
              className={styles.speakBtn}
              onClick={(e) => {
                e.stopPropagation()
                onSpeak(card.yoruba, 'yo')
              }}
              aria-label={`Pronounce ${card.yoruba}`}
              aria-busy={isSpeaking}
              type="button"
            >
              🔊
            </button>
            <p className={styles.word}>{card.yoruba}</p>
            <span className={styles.flipHint}>Tap to flip</span>
          </div>

          {/* Back face — English */}
          <div className={`${styles.face} ${styles.back}`}>
            <button
              className={styles.speakBtn}
              onClick={(e) => {
                e.stopPropagation()
                onSpeak(card.english, 'en-US')
              }}
              aria-label={`Pronounce ${card.english}`}
              aria-busy={isSpeaking}
              type="button"
            >
              🔊
            </button>
            <p className={styles.translation}>{card.english}</p>
            {card.notes && <p className={styles.notes}>{card.notes}</p>}
          </div>
        </div>
      </div>

      {/* Screen reader announcement when the card flips. */}
      <div aria-live="polite" className="sr-only">
        {isFlipped ? `Translation: ${card.english}` : ''}
      </div>

      {showActions && (
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.correct}`}
            onClick={onCorrect}
          >
            ✅ Got it
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.wrong}`}
            onClick={onWrong}
          >
            ❌ Still learning
          </button>
        </div>
      )}
    </>
  )
}
