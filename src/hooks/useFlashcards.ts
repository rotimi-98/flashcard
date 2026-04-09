import { useCallback, useMemo, useRef, useState } from 'react'
import type { Flashcard } from '../types/index.ts'
import { useApp } from '../context/useApp.ts'
import { fisherYatesShuffle } from '../utils/shuffle.ts'

export interface UseFlashcardsReturn {
  currentCard: Flashcard | null
  currentIndex: number
  totalCards: number
  isFlipped: boolean
  /** Whether the current card has already been assessed in this session. */
  isAssessed: boolean
  isSessionComplete: boolean
  correctCount: number
  wrongCount: number
  flip: () => void
  goNext: () => void
  goPrev: () => void
  markCorrect: () => void
  markWrong: () => void
  /** Reshuffles all cards and resets the session. Returns the new deck size. */
  restart: () => number
}

/**
 * Drives a flashcard study session: shuffles the deck, tracks position,
 * records outcomes via dispatch, and exposes navigation controls.
 * When `redoWrongOnly` is true the deck is filtered to cards flagged `isMarkedWrong`.
 */
export function useFlashcards(redoWrongOnly = false): UseFlashcardsReturn {
  const { state, dispatch } = useApp()

  const eligibleCards = useMemo(() => {
    if (!redoWrongOnly) return state.cards
    const wrongIds = new Set(
      state.records.filter((r) => r.isMarkedWrong).map((r) => r.cardId),
    )
    return state.cards.filter((c) => wrongIds.has(c.id))
  }, [state.cards, state.records, redoWrongOnly])

  const [deck, setDeck] = useState(() => fisherYatesShuffle(eligibleCards))
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Track which card indices have been assessed so navigating back doesn't re-record.
  const assessedSet = useRef(new Set<number>())
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [isSessionComplete, setIsSessionComplete] = useState(false)

  const totalCards = deck.length
  const currentCard = totalCards > 0 ? deck[index] ?? null : null
  const isAssessed = assessedSet.current.has(index)

  const advanceOrFinish = useCallback(() => {
    if (index + 1 >= totalCards) {
      setIsSessionComplete(true)
    } else {
      setIndex((i) => i + 1)
      setIsFlipped(false)
    }
  }, [index, totalCards])

  const markCorrect = useCallback(() => {
    if (!currentCard || assessedSet.current.has(index)) return
    assessedSet.current.add(index)
    dispatch({ type: 'RECORD_OUTCOME', payload: { cardId: currentCard.id, correct: true } })
    if (redoWrongOnly) {
      dispatch({ type: 'RESET_WRONG_FLAGS', payload: { cardIds: [currentCard.id] } })
    }
    setCorrectCount((c) => c + 1)
    advanceOrFinish()
  }, [currentCard, index, dispatch, advanceOrFinish, redoWrongOnly])

  const markWrong = useCallback(() => {
    if (!currentCard || assessedSet.current.has(index)) return
    assessedSet.current.add(index)
    dispatch({ type: 'RECORD_OUTCOME', payload: { cardId: currentCard.id, correct: false } })
    setWrongCount((c) => c + 1)
    advanceOrFinish()
  }, [currentCard, index, dispatch, advanceOrFinish])

  const flip = useCallback(() => setIsFlipped((f) => !f), [])

  const goNext = useCallback(() => {
    if (index + 1 >= totalCards) return
    setIndex((i) => i + 1)
    setIsFlipped(false)
  }, [index, totalCards])

  const goPrev = useCallback(() => {
    if (index <= 0) return
    setIndex((i) => i - 1)
    setIsFlipped(false)
  }, [index])

  const restart = useCallback((): number => {
    const reshuffled = fisherYatesShuffle(eligibleCards)
    setDeck(reshuffled)
    setIndex(0)
    setIsFlipped(false)
    assessedSet.current = new Set()
    setCorrectCount(0)
    setWrongCount(0)
    setIsSessionComplete(false)
    return reshuffled.length
  }, [eligibleCards])

  return {
    currentCard,
    currentIndex: index,
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
  }
}
