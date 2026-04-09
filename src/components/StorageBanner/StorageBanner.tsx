import styles from './StorageBanner.module.css'

interface StorageBannerProps {
  visible: boolean
}

/**
 * Persistent (non-dismissible) banner shown when localStorage is unavailable
 * (e.g. private browsing mode).
 */
export function StorageBanner({ visible }: StorageBannerProps) {
  if (!visible) return null

  return (
    <div className={styles.banner} role="alert">
      <span className={styles.icon} aria-hidden="true">⚠️</span>
      <p className={styles.body}>
        Progress won&rsquo;t be saved in private browsing.
      </p>
    </div>
  )
}
