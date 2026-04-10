import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FillInTheBlank } from '../components/QuizMode/FillInTheBlank.tsx'
import { MultipleChoice } from '../components/QuizMode/MultipleChoice.tsx'
import { QuizSummary } from '../components/QuizMode/QuizSummary.tsx'
import { useApp } from '../context/useApp.ts'
import { useSpeech } from '../hooks/useSpeech.ts'
import type { Flashcard } from '../types/index.ts'
import type {
  QuestionCount,
  QuizConfig,
  QuizDirection,
  QuizQuestion,
  QuizResult,
  QuizType,
} from '../types/quiz.ts'
import { parseAlternates } from '../utils/answerEval.ts'
import { fisherYatesShuffle } from '../utils/shuffle.ts'
import styles from './QuizPage.module.css'

type Phase = 'setup' | 'active' | 'summary'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a single card into a quiz question for the given direction. */
function toQuizQuestion(card: Flashcard, direction: QuizDirection): QuizQuestion {
  const prompt = direction === 'yo-en' ? card.yoruba : card.english
  const correctAnswer = direction === 'yo-en' ? card.english : card.yoruba
  const alternates = direction === 'yo-en' ? parseAlternates(card.notes) : []
  return { card, prompt, correctAnswer, alternates }
}

function quizSessionMode(type: QuizType): 'quiz-fill-blank' | 'quiz-multiple-choice' {
  return type === 'fill-blank' ? 'quiz-fill-blank' : 'quiz-multiple-choice'
}

function buildQuestions(
  cards: Flashcard[],
  count: QuestionCount,
  direction: QuizDirection,
): QuizQuestion[] {
  const shuffled = fisherYatesShuffle(cards)
  const limited =
    count === 'all' ? shuffled : shuffled.slice(0, Math.min(count, cards.length))
  return limited.map((card) => toQuizQuestion(card, direction))
}

// ---------------------------------------------------------------------------
// Setup screen
// ---------------------------------------------------------------------------

const QUIZ_TYPES: { value: QuizType; label: string }[] = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'fill-blank', label: 'Fill in the Blank' },
]

const DIRECTIONS: { value: QuizDirection; label: string }[] = [
  { value: 'yo-en', label: 'Yoruba → English' },
  { value: 'en-yo', label: 'English → Yoruba' },
]

const COUNTS: { value: QuestionCount; label: string }[] = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 'all', label: 'All' },
]

function QuizSetup({
  cardCount,
  onStart,
}: {
  cardCount: number
  onStart: (config: QuizConfig) => void
}) {
  const [type, setType] = useState<QuizType>('multiple-choice')
  const [direction, setDirection] = useState<QuizDirection>('yo-en')
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10)

  const mcDisabled = cardCount < 4
  const noCards = cardCount === 0

  // If MC is disabled and currently selected, switch to fill-blank.
  const effectiveType = mcDisabled && type === 'multiple-choice' ? 'fill-blank' : type

  if (noCards) {
    return (
      <div className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>No cards available</h2>
        <p className={styles.emptyText}>
          Add some vocabulary to start quizzing.
        </p>
        <Link to="/cards" className={styles.emptyLink}>
          Manage cards
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.setup}>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Quiz Type</span>
        <div className={styles.optionRow}>
          {QUIZ_TYPES.map((qt) => {
            const disabled = qt.value === 'multiple-choice' && mcDisabled
            return (
              <button
                key={qt.value}
                type="button"
                className={`${styles.optionBtn} ${effectiveType === qt.value ? styles.optionBtnActive : ''}`}
                onClick={() => setType(qt.value)}
                disabled={disabled}
                aria-pressed={effectiveType === qt.value}
              >
                {qt.label}
              </button>
            )
          })}
        </div>
        {mcDisabled && (
          <p className={styles.helperText}>
            Multiple choice requires at least 4 cards in the deck.
          </p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Direction</span>
        <div className={styles.optionRow}>
          {DIRECTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              className={`${styles.optionBtn} ${direction === d.value ? styles.optionBtnActive : ''}`}
              onClick={() => setDirection(d.value)}
              aria-pressed={direction === d.value}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Questions</span>
        <div className={styles.optionRow}>
          {COUNTS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`${styles.optionBtn} ${questionCount === c.value ? styles.optionBtnActive : ''}`}
              onClick={() => setQuestionCount(c.value)}
              aria-pressed={questionCount === c.value}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={styles.startBtn}
        onClick={() =>
          onStart({ type: effectiveType, direction, questionCount })
        }
      >
        Start Quiz
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main QuizPage
// ---------------------------------------------------------------------------

export function QuizPage() {
  const { state, dispatch } = useApp()
  const { speak, isSpeaking, isSupported: speechSupported } = useSpeech(state.settings)

  const [phase, setPhase] = useState<Phase>('setup')
  const [config, setConfig] = useState<QuizConfig | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [results, setResults] = useState<QuizResult[]>([])
  const sessionIdRef = useRef<string | null>(null)

  const handleStart = useCallback(
    (cfg: QuizConfig) => {
      const qs = buildQuestions(state.cards, cfg.questionCount, cfg.direction)
      setConfig(cfg)
      setQuestions(qs)
      setQuestionIndex(0)
      setResults([])
      setPhase('active')

      const id = crypto.randomUUID()
      sessionIdRef.current = id
      dispatch({
        type: 'START_SESSION',
        payload: {
          id,
          startedAt: new Date().toISOString(),
          mode: quizSessionMode(cfg.type),
          totalCards: qs.length,
          correctCount: 0,
          wrongCount: 0,
        },
      })
    },
    [state.cards, dispatch],
  )

  const handleAnswer = useCallback(
    (result: QuizResult) => {
      dispatch({
        type: 'RECORD_OUTCOME',
        payload: { cardId: result.card.id, correct: result.isCorrect },
      })

      const nextResults = [...results, result]
      setResults(nextResults)

      if (questionIndex + 1 >= questions.length) {
        const correctCount = nextResults.filter((r) => r.isCorrect).length
        const wrongCount = nextResults.length - correctCount
        if (sessionIdRef.current) {
          dispatch({
            type: 'END_SESSION',
            payload: {
              id: sessionIdRef.current,
              correctCount,
              wrongCount,
            },
          })
        }
        setPhase('summary')
      } else {
        setQuestionIndex((i) => i + 1)
      }
    },
    [results, questionIndex, questions.length, dispatch],
  )

  const handleRetryMissed = useCallback(() => {
    if (!config) return
    const missed = results.filter((r) => !r.isCorrect)
    const retryQuestions: QuizQuestion[] = fisherYatesShuffle(
      missed.map((r) => toQuizQuestion(r.card, config.direction)),
    )

    setQuestions(retryQuestions)
    setQuestionIndex(0)
    setResults([])
    setPhase('active')

    const id = crypto.randomUUID()
    sessionIdRef.current = id
    dispatch({
      type: 'START_SESSION',
      payload: {
        id,
        startedAt: new Date().toISOString(),
        mode: quizSessionMode(config.type),
        totalCards: retryQuestions.length,
        correctCount: 0,
        wrongCount: 0,
      },
    })
  }, [config, results, dispatch])

  const handleNewQuiz = useCallback(() => {
    setPhase('setup')
    setConfig(null)
    setQuestions([])
    setResults([])
    setQuestionIndex(0)
  }, [])

  // ---- Render ----

  if (phase === 'setup') {
    return (
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Quiz</h1>
        <QuizSetup cardCount={state.cards.length} onStart={handleStart} />
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <div className={styles.container}>
        <QuizSummary
          results={results}
          onRetryMissed={handleRetryMissed}
          onNewQuiz={handleNewQuiz}
        />
      </div>
    )
  }

  // Active quiz
  const currentQ = questions[questionIndex]!
  const progressPct = ((questionIndex + 1) / questions.length) * 100

  return (
    <div className={styles.container}>
      <div className={styles.quizProgress}>
        <p className={styles.quizProgressText}>
          Question {questionIndex + 1} of {questions.length}
        </p>
        <div
          className={styles.quizBar}
          role="progressbar"
          aria-valuenow={questionIndex + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-label={`Quiz progress: question ${questionIndex + 1} of ${questions.length}`}
        >
          <div
            className={styles.quizBarFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {config!.type === 'multiple-choice' ? (
        <MultipleChoice
          key={currentQ.card.id + questionIndex}
          question={currentQ}
          allCards={state.cards}
          direction={config!.direction}
          onAnswer={handleAnswer}
          onSpeak={speak}
          isSpeaking={isSpeaking}
          speechDisabled={!state.settings.speechEnabled}
          speechSupported={speechSupported}
        />
      ) : (
        <FillInTheBlank
          key={currentQ.card.id + questionIndex}
          question={currentQ}
          direction={config!.direction}
          onAnswer={handleAnswer}
          onSpeak={speak}
          isSpeaking={isSpeaking}
          speechDisabled={!state.settings.speechEnabled}
          speechSupported={speechSupported}
        />
      )}
    </div>
  )
}
