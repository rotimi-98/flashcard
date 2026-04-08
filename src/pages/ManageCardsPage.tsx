import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useApp } from '../context/useApp.ts'
import type { Flashcard } from '../types/index.ts'
import { speak } from '../utils/speak.ts'
import styles from './ManageCardsPage.module.css'

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------

function DeleteDialog({
  card,
  onConfirm,
  onCancel,
}: {
  card: Flashcard
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
        aria-label="Confirm card deletion"
        aria-describedby="delete-dialog-desc"
        className={styles.dialog}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className={styles.dialogTitle}>Delete card</h2>
        <p id="delete-dialog-desc" className={styles.dialogText}>
          Delete <strong>{card.yoruba}</strong> — {card.english}? This cannot
          be undone.
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
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add / Edit card form
// ---------------------------------------------------------------------------

function CardForm({
  editCard,
  onDone,
}: {
  editCard: Flashcard | null
  onDone: () => void
}) {
  const { dispatch } = useApp()
  const [yoruba, setYoruba] = useState(editCard?.yoruba ?? '')
  const [english, setEnglish] = useState(editCard?.english ?? '')
  const [notes, setNotes] = useState(editCard?.notes ?? '')
  const [errors, setErrors] = useState<{ yoruba?: string; english?: string }>(
    {},
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedY = yoruba.trim()
    const trimmedE = english.trim()
    const next: typeof errors = {}
    if (!trimmedY) next.yoruba = 'Yoruba is required'
    if (!trimmedE) next.english = 'English is required'
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    if (editCard) {
      dispatch({
        type: 'EDIT_CARD',
        payload: {
          id: editCard.id,
          yoruba: trimmedY,
          english: trimmedE,
          notes: notes.trim() || undefined,
        },
      })
    } else {
      dispatch({
        type: 'ADD_CARD',
        payload: {
          yoruba: trimmedY,
          english: trimmedE,
          notes: notes.trim() || undefined,
        },
      })
    }

    onDone()
  }

  return (
    <form
      className={styles.formSection}
      onSubmit={handleSubmit}
      noValidate
      aria-label={editCard ? 'Edit card' : 'Add new card'}
    >
      <h2 className={styles.formTitle}>
        {editCard ? 'Edit card' : 'Add a new card'}
      </h2>

      <div className={styles.formRow}>
        <label className={styles.formLabel} htmlFor="card-yoruba">
          Yoruba
        </label>
        <input
          id="card-yoruba"
          className={`${styles.formInput} ${errors.yoruba ? styles.inputError : ''}`}
          type="text"
          value={yoruba}
          onChange={(e) => {
            setYoruba(e.target.value)
            if (errors.yoruba) setErrors((p) => ({ ...p, yoruba: undefined }))
          }}
          autoFocus
        />
        {errors.yoruba && (
          <p className={styles.errorText} role="alert">
            {errors.yoruba}
          </p>
        )}
      </div>

      <div className={styles.formRow}>
        <label className={styles.formLabel} htmlFor="card-english">
          English
        </label>
        <input
          id="card-english"
          className={`${styles.formInput} ${errors.english ? styles.inputError : ''}`}
          type="text"
          value={english}
          onChange={(e) => {
            setEnglish(e.target.value)
            if (errors.english)
              setErrors((p) => ({ ...p, english: undefined }))
          }}
        />
        {errors.english && (
          <p className={styles.errorText} role="alert">
            {errors.english}
          </p>
        )}
      </div>

      <div className={styles.formRow}>
        <label className={styles.formLabel} htmlFor="card-notes">
          Notes (optional)
        </label>
        <textarea
          id="card-notes"
          className={`${styles.formInput} ${styles.formTextarea}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.submitBtn}>
          {editCard ? 'Save changes' : 'Add card'}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ManageCardsPage() {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editCard, setEditCard] = useState<Flashcard | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return state.cards
    const q = search.trim().toLowerCase()
    return state.cards.filter(
      (c) =>
        c.yoruba.toLowerCase().includes(q) ||
        c.english.toLowerCase().includes(q),
    )
  }, [state.cards, search])

  const handleSpeak = useCallback(
    (text: string, lang: 'yo' | 'en-US') => speak(text, lang),
    [],
  )

  const handleFormDone = useCallback(() => {
    setShowForm(false)
    setEditCard(null)
  }, [])

  const openEdit = useCallback((card: Flashcard) => {
    setEditCard(card)
    setShowForm(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return
    dispatch({ type: 'DELETE_CARD', payload: { id: deleteTarget.id } })
    setDeleteTarget(null)
  }, [deleteTarget, dispatch])

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Manage cards</h1>

      {showForm && <CardForm editCard={editCard} onDone={handleFormDone} />}

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search cards…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search cards by Yoruba or English"
        />
        {!showForm && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              setEditCard(null)
              setShowForm(true)
            }}
          >
            + Add card
          </button>
        )}
      </div>

      <p className={styles.count}>
        {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        {search.trim() ? ` matching "${search.trim()}"` : ''}
      </p>

      {filtered.length === 0 && (
        <p className={styles.noResults}>No cards found.</p>
      )}

      <div className={styles.list} role="list">
        {filtered.map((card) => (
          <div key={card.id} className={styles.row} role="listitem">
            <div className={styles.rowText}>
              <span className={styles.rowYoruba}>{card.yoruba}</span>
              <span className={styles.rowEnglish}>{card.english}</span>
            </div>

            <div className={styles.rowActions}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleSpeak(card.yoruba, 'yo')}
                aria-label={`Pronounce ${card.yoruba}`}
              >
                🔊
              </button>

              {!card.isPreloaded && (
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => openEdit(card)}
                  aria-label={`Edit ${card.yoruba}`}
                >
                  ✏️
                </button>
              )}

              {card.isPreloaded ? (
                <span className={styles.lockIcon} aria-label="Pre-loaded card">
                  🔒
                </span>
              ) : (
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.deleteBtn}`}
                  onClick={() => setDeleteTarget(card)}
                  aria-label={`Delete ${card.yoruba}`}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <DeleteDialog
          card={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
