import { Outlet } from 'react-router-dom'
import { useApp } from '../../context/useApp.ts'
import { useSpeech } from '../../hooks/useSpeech.ts'
import { SpeechBanner } from '../SpeechBanner/SpeechBanner.tsx'
import { Navbar } from './Navbar.tsx'
import styles from './Layout.module.css'

export function Layout() {
  const { state } = useApp()
  const { hasYorubaVoice, isSupported } = useSpeech(state.settings)

  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.main}>
        <SpeechBanner
          hasYorubaVoice={hasYorubaVoice}
          isSupported={isSupported}
        />
        <Outlet />
      </main>
    </div>
  )
}
