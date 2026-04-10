import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react'
import styles from './CharacterPicker.module.css'

/** Number of columns in the character grid — must match the CSS grid layout. */
const GRID_COLUMNS = 5

// ---------------------------------------------------------------------------
// Character data — grouped by base letter, lowercase and uppercase variants.
// ---------------------------------------------------------------------------

interface CharEntry {
  char: string
  label: string
}

interface CharGroup {
  name: string
  chars: CharEntry[]
}

const LOWER_GROUPS: CharGroup[] = [
  {
    name: 'a',
    chars: [
      { char: 'à', label: 'a with low tone' },
      { char: 'á', label: 'a with high tone' },
    ],
  },
  {
    name: 'e',
    chars: [
      { char: 'è', label: 'e with low tone' },
      { char: 'é', label: 'e with high tone' },
      { char: 'ẹ', label: 'e with underdot' },
      { char: 'ẹ̀', label: 'e with underdot and low tone' },
      { char: 'ẹ́', label: 'e with underdot and high tone' },
    ],
  },
  {
    name: 'i',
    chars: [
      { char: 'ì', label: 'i with low tone' },
      { char: 'í', label: 'i with high tone' },
    ],
  },
  {
    name: 'o',
    chars: [
      { char: 'ò', label: 'o with low tone' },
      { char: 'ó', label: 'o with high tone' },
      { char: 'ọ', label: 'o with underdot' },
      { char: 'ọ̀', label: 'o with underdot and low tone' },
      { char: 'ọ́', label: 'o with underdot and high tone' },
    ],
  },
  {
    name: 'u',
    chars: [
      { char: 'ù', label: 'u with low tone' },
      { char: 'ú', label: 'u with high tone' },
    ],
  },
  {
    name: 'n',
    chars: [
      { char: 'ǹ', label: 'n with low tone' },
      { char: 'ń', label: 'n with high tone' },
    ],
  },
  {
    name: 's',
    chars: [{ char: 'ṣ', label: 's with underdot' }],
  },
]

function toUpperGroup(g: CharGroup): CharGroup {
  return {
    name: g.name.toUpperCase(),
    chars: g.chars.map((c) => ({
      char: c.char.toUpperCase(),
      label: c.label.replace(/^[a-z]/, (m) => m.toUpperCase()),
    })),
  }
}

const UPPER_GROUPS: CharGroup[] = LOWER_GROUPS.map(toUpperGroup)

// ---------------------------------------------------------------------------
// Insertion helper — inserts text at the cursor position of a target input.
// ---------------------------------------------------------------------------

function insertAtCursor(
  target: HTMLInputElement | HTMLTextAreaElement,
  char: string,
) {
  const start = target.selectionStart ?? target.value.length
  const end = target.selectionEnd ?? start
  const before = target.value.slice(0, start)
  const after = target.value.slice(end)

  // Use the native InputEvent dispatch to keep React's controlled state in sync.
  const nativeSet = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(target),
    'value',
  )?.set
  nativeSet?.call(target, before + char + after)
  target.dispatchEvent(new Event('input', { bubbles: true }))

  // Place cursor immediately after the inserted character.
  const newPos = start + char.length
  requestAnimationFrame(() => {
    target.focus()
    target.setSelectionRange(newPos, newPos)
  })
}

// ---------------------------------------------------------------------------
// CharacterPicker component
// ---------------------------------------------------------------------------

export interface CharacterPickerProps {
  targetRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  onInsert: (char: string) => void
}

/**
 * Floating character picker for Yoruba tone marks and underdot letters.
 * Renders a toggle button; when open, shows a panel of character buttons
 * grouped by base letter with a lowercase/uppercase switch.
 */
export function CharacterPicker({ targetRef, onInsert }: CharacterPickerProps) {
  const [open, setOpen] = useState(false)
  const [upperCase, setUpperCase] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const charBtnsRef = useRef<(HTMLButtonElement | null)[]>([])

  const groups = upperCase ? UPPER_GROUPS : LOWER_GROUPS
  const allChars = groups.flatMap((g) => g.chars)

  // Close when clicking outside the panel and toggle button.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        panelRef.current?.contains(target) ||
        toggleRef.current?.contains(target)
      )
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const handleInsert = useCallback(
    (char: string) => {
      if (targetRef.current) {
        insertAtCursor(targetRef.current, char)
      }
      onInsert(char)
    },
    [targetRef, onInsert],
  )

  // Arrow-key navigation within the character grid.
  const handleCharKeyDown = useCallback(
    (e: ReactKeyboardEvent, flatIdx: number) => {
      let nextIdx: number | null = null
      if (e.key === 'ArrowRight') nextIdx = Math.min(flatIdx + 1, allChars.length - 1)
      else if (e.key === 'ArrowLeft') nextIdx = Math.max(flatIdx - 1, 0)
      else if (e.key === 'ArrowDown') nextIdx = Math.min(flatIdx + GRID_COLUMNS, allChars.length - 1)
      else if (e.key === 'ArrowUp') nextIdx = Math.max(flatIdx - GRID_COLUMNS, 0)

      if (nextIdx !== null) {
        e.preventDefault()
        charBtnsRef.current[nextIdx]?.focus()
      }
    },
    [allChars.length],
  )

  let flatIdx = 0

  return (
    <div className={styles.wrapper}>
      <button
        ref={toggleRef}
        type="button"
        className={`${styles.toggle} ${open ? styles.toggleOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Yoruba character picker"
        aria-expanded={open}
      >
        ẹ
      </button>

      {open && (
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-label="Yoruba character picker"
        >
          <div className={styles.caseToggle}>
            <button
              type="button"
              className={`${styles.caseBtn} ${!upperCase ? styles.caseBtnActive : ''}`}
              onClick={() => setUpperCase(false)}
            >
              abc
            </button>
            <button
              type="button"
              className={`${styles.caseBtn} ${upperCase ? styles.caseBtnActive : ''}`}
              onClick={() => setUpperCase(true)}
            >
              ABC
            </button>
          </div>

          {groups.map((group) => (
            <div key={group.name} className={styles.group}>
              <span className={styles.groupLabel}>{group.name}</span>
              <div className={styles.chars}>
                {group.chars.map((entry) => {
                  const idx = flatIdx++
                  return (
                    <button
                      key={entry.char}
                      ref={(el) => {
                        charBtnsRef.current[idx] = el
                      }}
                      type="button"
                      className={styles.charBtn}
                      aria-label={entry.label}
                      onClick={() => handleInsert(entry.char)}
                      onKeyDown={(e) => handleCharKeyDown(e, idx)}
                    >
                      {entry.char}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
