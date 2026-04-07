import { useEffect, useRef } from 'react'

type Props = {
  onConfirm: () => void
  onCancel: () => void
}

/** Shown when stored `schemaVersion` ≠ `CURRENT_SCHEMA_VERSION` (Phase 2.4 / §10). */
export function SchemaMigrationDialog({ onConfirm, onCancel }: Props) {
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
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schema-migration-title"
        aria-describedby="schema-migration-desc"
        style={{
          background: 'Canvas',
          color: 'CanvasText',
          maxWidth: '26rem',
          width: '100%',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id="schema-migration-title"
          style={{ fontSize: '1.125rem', margin: '0 0 0.75rem' }}
        >
          Saved data version
        </h2>
        <p
          id="schema-migration-desc"
          style={{ margin: '0 0 1.25rem', lineHeight: 1.5, fontSize: '0.95rem' }}
        >
          Your saved data is from an older version. Reset and start fresh?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button ref={confirmRef} type="button" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
