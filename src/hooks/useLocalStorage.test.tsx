/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage.ts'

const KEY = 'test_ls_key'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initialises from localStorage when present', () => {
    localStorage.setItem(KEY, JSON.stringify({ a: 1 }))
    const { result } = renderHook(() => useLocalStorage(KEY, { a: 0 }))
    expect(result.current[0]).toEqual({ a: 1 })
  })

  it('uses initial value when key absent', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, { x: 'y' }))
    expect(result.current[0]).toEqual({ x: 'y' })
  })

  it('setter persists value readable by getItem', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, { n: 0 }))
    act(() => {
      result.current[1]({ n: 42 })
    })
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ n: 42 })
    expect(result.current[0]).toEqual({ n: 42 })
  })

  it('warns and uses memory when setItem throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const { result } = renderHook(() => useLocalStorage(KEY, { ok: true }))
    act(() => {
      result.current[1]({ ok: false })
    })
    expect(result.current[0]).toEqual({ ok: false })
    expect(console.warn).toHaveBeenCalled()
    spy.mockRestore()
  })
})
