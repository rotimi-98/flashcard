/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { defaultAppSettings } from '../utils/defaultSettings.ts'
import type { AppSettings } from '../types/index.ts'
import { useSpeech } from './useSpeech.ts'

function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return { ...defaultAppSettings, ...overrides }
}

const mockSpeak = vi.fn()
const mockCancel = vi.fn()
const mockGetVoices = vi.fn<() => SpeechSynthesisVoice[]>(() => [])
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

class MockUtterance {
  text: string
  lang = ''
  rate = 1
  voice: SpeechSynthesisVoice | null = null
  onstart: ((ev: Event) => void) | null = null
  onend: ((ev: Event) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

beforeEach(() => {
  vi.clearAllMocks()

  // jsdom doesn't provide SpeechSynthesisUtterance
  ;(globalThis as Record<string, unknown>).SpeechSynthesisUtterance =
    MockUtterance

  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: mockSpeak,
      cancel: mockCancel,
      getVoices: mockGetVoices,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (globalThis as Record<string, unknown>).SpeechSynthesisUtterance
})

describe('useSpeech', () => {
  it('returns isSupported = true when speechSynthesis exists', () => {
    const { result } = renderHook(() => useSpeech(makeSettings()))
    expect(result.current.isSupported).toBe(true)
  })

  it('speak() cancels previous utterance and calls speechSynthesis.speak', () => {
    const { result } = renderHook(() => useSpeech(makeSettings()))

    act(() => result.current.speak('hello', 'en-US'))

    expect(mockCancel).toHaveBeenCalledTimes(1)
    expect(mockSpeak).toHaveBeenCalledTimes(1)
    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.lang).toBe('en-US')
    expect(utterance.rate).toBe(defaultAppSettings.speechRate)
  })

  it('stop() calls speechSynthesis.cancel', () => {
    const { result } = renderHook(() => useSpeech(makeSettings()))

    act(() => result.current.stop())

    expect(mockCancel).toHaveBeenCalledTimes(1)
  })

  it('does not speak when speechEnabled is false', () => {
    const { result } = renderHook(() =>
      useSpeech(makeSettings({ speechEnabled: false })),
    )

    act(() => result.current.speak('test', 'en-US'))

    expect(mockSpeak).not.toHaveBeenCalled()
  })

  it('uses the configured speechRate', () => {
    const { result } = renderHook(() =>
      useSpeech(makeSettings({ speechRate: 1.5 })),
    )

    act(() => result.current.speak('test', 'en-US'))

    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.rate).toBe(1.5)
  })

  it('sets isSpeaking to true on utterance start and false on end', () => {
    const { result } = renderHook(() => useSpeech(makeSettings()))

    act(() => result.current.speak('hello', 'en-US'))

    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance

    act(() => utterance.onstart?.(new Event('start') as never))
    expect(result.current.isSpeaking).toBe(true)

    act(() => utterance.onend?.(new Event('end') as never))
    expect(result.current.isSpeaking).toBe(false)
  })

  it('hasYorubaVoice is false when no voices match "yo"', () => {
    mockGetVoices.mockReturnValue([])
    const { result } = renderHook(() => useSpeech(makeSettings()))
    expect(result.current.hasYorubaVoice).toBe(false)
  })

  it('hasYorubaVoice is true when a yo-* voice exists', () => {
    mockGetVoices.mockReturnValue([
      { lang: 'yo-NG', name: 'Yoruba', voiceURI: '', localService: true, default: false },
    ] as SpeechSynthesisVoice[])

    const { result } = renderHook(() => useSpeech(makeSettings()))
    expect(result.current.hasYorubaVoice).toBe(true)
  })

  it('subscribes to voiceschanged event on mount', () => {
    renderHook(() => useSpeech(makeSettings()))

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function),
    )
  })

  it('unsubscribes from voiceschanged on unmount', () => {
    const { unmount } = renderHook(() => useSpeech(makeSettings()))
    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function),
    )
  })

  it('omits lang for Yoruba text when no Yoruba voice is available', () => {
    mockGetVoices.mockReturnValue([])
    const { result } = renderHook(() => useSpeech(makeSettings()))

    act(() => result.current.speak('omi', 'yo'))

    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.lang).toBe('')
  })
})
