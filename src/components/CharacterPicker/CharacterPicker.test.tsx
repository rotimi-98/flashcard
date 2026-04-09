/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { CharacterPicker } from './CharacterPicker.tsx'
import { createRef } from 'react'

afterEach(cleanup)

describe('CharacterPicker', () => {
  function renderPicker(onInsert = vi.fn()) {
    const targetRef = createRef<HTMLInputElement>()
    const result = render(
      <>
        <input ref={targetRef} data-testid="target" />
        <CharacterPicker targetRef={targetRef} onInsert={onInsert} />
      </>,
    )
    return { ...result, onInsert, targetRef }
  }

  function openPicker() {
    fireEvent.click(
      screen.getByRole('button', { name: /character picker/i }),
    )
  }

  it('shows the toggle button', () => {
    renderPicker()
    expect(
      screen.getByRole('button', { name: /character picker/i }),
    ).toBeDefined()
  })

  it('opens the panel when the toggle is clicked', () => {
    renderPicker()
    openPicker()
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('calls onInsert with the correct character when a char button is clicked', () => {
    const onInsert = vi.fn()
    renderPicker(onInsert)
    openPicker()
    const charBtn = screen.getByRole('button', { name: 'a with low tone' })
    fireEvent.click(charBtn)
    expect(onInsert).toHaveBeenCalledWith('à')
  })

  it('closes the panel when Escape is pressed', () => {
    renderPicker()
    openPicker()
    expect(screen.getByRole('dialog')).toBeDefined()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('switches to uppercase characters when ABC is clicked', () => {
    renderPicker()
    openPicker()
    fireEvent.click(screen.getByText('ABC'))
    expect(
      screen.getByRole('button', { name: 'A with low tone' }),
    ).toBeDefined()
  })
})
