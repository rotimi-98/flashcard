import { useState } from 'react'
import styles from './SpeechBanner.module.css'

interface SpeechBannerProps {
  hasYorubaVoice: boolean
  isSupported: boolean
}

/**
 * Session-scoped banner shown when Web Speech API has no Yoruba voice.
 * Dismissible — once closed it stays hidden for the rest of the session.
 */
export function SpeechBanner({ hasYorubaVoice, isSupported }: SpeechBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || hasYorubaVoice || !isSupported) return null

  return (
    <div className={styles.banner} role="status">
      <span className={styles.icon} aria-hidden="true">
        ℹ️
      </span>
      <p className={styles.body}>
        No Yoruba voice is installed on your device. Speech will use the default
        voice. Check your system's Text-to-Speech settings to install a Yoruba
        voice for the best experience.
      </p>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss notice"
      >
        ✕
      </button>
    </div>
  )
}
