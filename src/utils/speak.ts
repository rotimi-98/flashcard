/**
 * Speaks the given text using the Web Speech API.
 * For Yoruba ('yo'), falls back to the default voice when no Yoruba voice
 * is installed — this produces a better phonetic reading than forcing a
 * non-existent language model.
 */
export function speak(text: string, lang: 'yo' | 'en-US'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.85

  if (lang === 'yo') {
    const voices = window.speechSynthesis.getVoices()
    const yorubaVoice = voices.find((v) => v.lang.startsWith('yo'))
    if (yorubaVoice) {
      utterance.voice = yorubaVoice
      utterance.lang = 'yo'
    }
    // When no Yoruba voice exists, leave lang unset so the default voice
    // reads each syllable phonetically rather than applying English rules.
  } else {
    utterance.lang = lang
  }

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
