import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppSettings } from '../types/index.ts'

export interface UseSpeechReturn {
  speak: (text: string, lang: 'yo' | 'en-US') => void
  stop: () => void
  isSpeaking: boolean
  isSupported: boolean
  availableVoices: SpeechSynthesisVoice[]
  hasYorubaVoice: boolean
}

/**
 * Wraps the Web Speech API with React state tracking.
 * Reads `speechRate`, `speechVoice`, and `speechEnabled` from app settings.
 * Falls back gracefully when no Yoruba voice is installed.
 */
export function useSpeech(settings: AppSettings): UseSpeechReturn {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >(() => (isSupported ? window.speechSynthesis.getVoices() : []))

  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Chrome loads voices asynchronously — listen for the voiceschanged event.
  useEffect(() => {
    if (!isSupported) return
    const update = () => setAvailableVoices(window.speechSynthesis.getVoices())
    window.speechSynthesis.addEventListener('voiceschanged', update)
    update()
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', update)
  }, [isSupported])

  const hasYorubaVoice = availableVoices.some((v) => v.lang.startsWith('yo'))

  const speak = useCallback(
    (text: string, lang: 'yo' | 'en-US') => {
      if (!isSupported || !settings.speechEnabled) return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = settings.speechRate

      if (lang === 'yo') {
        const yorubaVoice = availableVoices.find((v) =>
          v.lang.startsWith('yo'),
        )
        if (yorubaVoice) {
          utterance.voice = yorubaVoice
          utterance.lang = 'yo'
        }
        // When no Yoruba voice exists the lang is left unset so the
        // default voice reads phonetically rather than applying wrong rules.
      } else {
        utterance.lang = lang
        if (settings.speechVoice) {
          const chosen = availableVoices.find(
            (v) => v.name === settings.speechVoice,
          )
          if (chosen) utterance.voice = chosen
        }
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isSupported, settings.speechEnabled, settings.speechRate, settings.speechVoice, availableVoices],
  )

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    availableVoices,
    hasYorubaVoice,
  }
}
