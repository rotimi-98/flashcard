import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/useApp.ts'
import type { CardRecord, Flashcard } from '../types/index.ts'
import styles from './StatsPage.module.css'

// ---------------------------------------------------------------------------
// KPI helpers
// ---------------------------------------------------------------------------

function useKpis() {
  const { state } = useApp()
  const { cards, records, sessions } = state

  return useMemo(() => {
    const totalCards = cards.length
    const cardsStudied = records.length
    const totalSessions = sessions.filter((s) => s.endedAt).length

    const totalCorrect = records.reduce((s, r) => s + r.timesCorrect, 0)
    const totalAttempts = records.reduce((s, r) => s + r.timesStudied, 0)
    const overallAccuracy =
      totalAttempts > 0
        ? Math.round((totalCorrect / totalAttempts) * 1000) / 10
        : 0

    const cardsMastered = records.filter(
      (r) => r.timesStudied >= 3 && r.timesCorrect / r.timesStudied >= 0.8,
    ).length

    const cardsToRevisit = records.filter((r) => r.isMarkedWrong).length

    return {
      totalCards,
      cardsStudied,
      totalSessions,
      overallAccuracy,
      cardsMastered,
      cardsToRevisit,
    }
  }, [cards, records, sessions])
}

// ---------------------------------------------------------------------------
// Chart data helpers
// ---------------------------------------------------------------------------

function useAccuracyData() {
  const { state } = useApp()

  return useMemo(() => {
    const completed = state.sessions
      .filter((s) => s.endedAt)
      .slice(-20)

    return completed.map((s) => {
      const total = s.correctCount + s.wrongCount
      const pct = total > 0 ? Math.round((s.correctCount / total) * 100) : 0
      const date = new Date(s.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
      return { date, accuracy: pct }
    })
  }, [state.sessions])
}

function useActivityData() {
  const { state } = useApp()

  return useMemo(() => {
    const now = new Date()
    const days: { date: string; count: number }[] = []

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
      days.push({ date: label, count: 0 })

      for (const s of state.sessions) {
        if (!s.endedAt) continue
        if (s.startedAt.slice(0, 10) === key) {
          days[days.length - 1]!.count += s.totalCards
        }
      }
    }

    return days
  }, [state.sessions])
}

// ---------------------------------------------------------------------------
// Card performance table
// ---------------------------------------------------------------------------

type SortCol =
  | 'yoruba'
  | 'english'
  | 'studied'
  | 'correct'
  | 'wrong'
  | 'accuracy'
  | 'lastStudied'

interface TableRow {
  card: Flashcard
  record: CardRecord | undefined
  studied: number
  correct: number
  wrong: number
  accuracy: number
  lastStudied: string
}

function buildRows(cards: Flashcard[], records: CardRecord[]): TableRow[] {
  const recordMap = new Map(records.map((r) => [r.cardId, r]))

  return cards.map((card) => {
    const rec = recordMap.get(card.id)
    return {
      card,
      record: rec,
      studied: rec?.timesStudied ?? 0,
      correct: rec?.timesCorrect ?? 0,
      wrong: rec?.timesWrong ?? 0,
      accuracy:
        rec && rec.timesStudied > 0
          ? Math.round((rec.timesCorrect / rec.timesStudied) * 100)
          : 0,
      lastStudied: rec?.lastStudied ?? '',
    }
  })
}

function sortRows(rows: TableRow[], col: SortCol, asc: boolean): TableRow[] {
  const sorted = [...rows]
  const dir = asc ? 1 : -1

  sorted.sort((a, b) => {
    switch (col) {
      case 'yoruba':
        return dir * a.card.yoruba.localeCompare(b.card.yoruba)
      case 'english':
        return dir * a.card.english.localeCompare(b.card.english)
      case 'studied':
        return dir * (a.studied - b.studied)
      case 'correct':
        return dir * (a.correct - b.correct)
      case 'wrong':
        return dir * (a.wrong - b.wrong)
      case 'accuracy':
        return dir * (a.accuracy - b.accuracy)
      case 'lastStudied':
        return dir * a.lastStudied.localeCompare(b.lastStudied)
    }
  })

  return sorted
}

// ---------------------------------------------------------------------------
// Reset dialog
// ---------------------------------------------------------------------------

function ResetDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirm progress reset"
        aria-describedby="reset-dialog-desc"
        className={styles.dialog}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className={styles.dialogTitle}>Reset all progress</h2>
        <p id="reset-dialog-desc" className={styles.dialogText}>
          This will clear all study records, quiz sessions, and performance
          data. Your cards will not be deleted. This cannot be undone.
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogCancel}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={styles.dialogConfirm}
            onClick={onConfirm}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatsPage
// ---------------------------------------------------------------------------

const COLUMNS: { key: SortCol; label: string }[] = [
  { key: 'yoruba', label: 'Yoruba' },
  { key: 'english', label: 'English' },
  { key: 'studied', label: 'Studied' },
  { key: 'correct', label: 'Correct' },
  { key: 'wrong', label: 'Wrong' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'lastStudied', label: 'Last Studied' },
]

export function StatsPage() {
  const { state, dispatch } = useApp()
  const kpis = useKpis()
  const accuracyData = useAccuracyData()
  const activityData = useActivityData()

  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('yoruba')
  const [sortAsc, setSortAsc] = useState(true)
  const [showResetDialog, setShowResetDialog] = useState(false)

  const allRows = useMemo(
    () => buildRows(state.cards, state.records),
    [state.cards, state.records],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter(
      (r) =>
        r.card.yoruba.toLowerCase().includes(q) ||
        r.card.english.toLowerCase().includes(q),
    )
  }, [allRows, search])

  const sorted = useMemo(
    () => sortRows(filtered, sortCol, sortAsc),
    [filtered, sortCol, sortAsc],
  )

  const handleSort = useCallback(
    (col: SortCol) => {
      if (col === sortCol) {
        setSortAsc((a) => !a)
      } else {
        setSortCol(col)
        setSortAsc(true)
      }
    },
    [sortCol],
  )

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_ALL_PROGRESS' })
    setShowResetDialog(false)
  }, [dispatch])

  const accentColor = 'var(--accent, #0f766e)'
  const warmColor = 'var(--accent-warm, #d97706)'

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Statistics</h1>

      {/* ---- KPI Cards ---- */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{kpis.totalCards}</span>
          <span className={styles.kpiLabel}>Total Cards</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{kpis.cardsStudied}</span>
          <span className={styles.kpiLabel}>Cards Studied</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{kpis.totalSessions}</span>
          <span className={styles.kpiLabel}>Sessions</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={`${styles.kpiValue} ${styles.kpiAccent}`}>
            {kpis.overallAccuracy > 0 ? `${kpis.overallAccuracy}%` : '—'}
          </span>
          <span className={styles.kpiLabel}>Accuracy</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={`${styles.kpiValue} ${styles.kpiGreen}`}>
            {kpis.cardsMastered}
          </span>
          <span className={styles.kpiLabel}>Mastered</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={`${styles.kpiValue} ${styles.kpiRose}`}>
            {kpis.cardsToRevisit}
          </span>
          <span className={styles.kpiLabel}>To Revisit</span>
        </div>
      </div>

      {/* ---- Accuracy Over Time ---- */}
      <div className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Accuracy Over Time</h2>
        <div className={styles.chartWrap}>
          {accuracyData.length === 0 ? (
            <p className={styles.chartEmpty}>
              Complete a study or quiz session to see accuracy trends.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Accuracy']}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={accentColor}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ---- Study Activity ---- */}
      <div className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Study Activity (last 14 days)</h2>
        <div className={styles.chartWrap}>
          {activityData.every((d) => d.count === 0) ? (
            <p className={styles.chartEmpty}>
              No study activity in the last 14 days.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [v, 'Cards']}
                />
                <Bar dataKey="count" fill={warmColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ---- Card Performance Table ---- */}
      <div className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>Card Performance</h2>
        <div className={styles.tableSearchRow}>
          <input
            className={styles.tableSearch}
            type="search"
            placeholder="Search cards…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter cards by Yoruba or English"
          />
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort(col.key)
                      }
                    }}
                    tabIndex={0}
                    role="columnheader"
                    aria-sort={
                      sortCol === col.key
                        ? sortAsc
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    aria-label={`Sort by ${col.label}`}
                  >
                    {col.label}
                    {sortCol === col.key && (
                      <span className={styles.sortIndicator}>
                        {sortAsc ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.card.id}>
                  <td>{row.card.yoruba}</td>
                  <td>{row.card.english}</td>
                  <td>
                    {row.studied > 0 ? (
                      row.studied
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td>
                    {row.studied > 0 ? (
                      row.correct
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td>
                    {row.studied > 0 ? (
                      row.wrong
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td>
                    {row.studied > 0 ? (
                      `${row.accuracy}%`
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td>
                    {row.lastStudied ? (
                      new Date(row.lastStudied).toLocaleDateString()
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Reset ---- */}
      <div className={styles.resetSection}>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={() => setShowResetDialog(true)}
        >
          Reset All Progress
        </button>
      </div>

      {showResetDialog && (
        <ResetDialog
          onConfirm={handleReset}
          onCancel={() => setShowResetDialog(false)}
        />
      )}
    </div>
  )
}
