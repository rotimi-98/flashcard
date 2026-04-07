import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout/Layout.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ManageCardsPage } from './pages/ManageCardsPage.tsx'
import { QuizPage } from './pages/QuizPage.tsx'
import { StatsPage } from './pages/StatsPage.tsx'
import { StudyPage } from './pages/StudyPage.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="study/redo" element={<StudyPage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="cards" element={<ManageCardsPage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
