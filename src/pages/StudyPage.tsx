import { useLocation } from 'react-router-dom'
import shell from './pageShell.module.css'

export function StudyPage() {
  const { pathname } = useLocation()
  const isRedo = pathname.endsWith('/redo')

  return (
    <div className={shell.wrap}>
      <h1 className={shell.title}>
        {isRedo ? 'Redo wrong cards' : 'Study mode'}
      </h1>
      <p className={shell.lead}>
        {isRedo
          ? 'You are in redo mode. The full study experience arrives in Phase 4.'
          : 'Shuffle, flip, and track sessions here. Coming in Phase 4.'}
      </p>
    </div>
  )
}
