import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout/Layout.tsx'
import { HomePage } from './pages/HomePage.tsx'

// Lazy-loaded page routes — each page is code-split into its own chunk so the
// initial bundle only includes HomePage. The `.then()` re-maps the named export
// to a default export because React.lazy requires a default export.
const StudyPage = lazy(() =>
  import('./pages/StudyPage.tsx').then((m) => ({ default: m.StudyPage })),
)
const QuizPage = lazy(() =>
  import('./pages/QuizPage.tsx').then((m) => ({ default: m.QuizPage })),
)
const ManageCardsPage = lazy(() =>
  import('./pages/ManageCardsPage.tsx').then((m) => ({ default: m.ManageCardsPage })),
)
const StatsPage = lazy(() =>
  import('./pages/StatsPage.tsx').then((m) => ({ default: m.StatsPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage })),
)

function PageFallback() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text, #5c5668)' }}>
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="study/redo" element={<StudyPage />} />
            <Route path="study" element={<StudyPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="cards" element={<ManageCardsPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
