import shell from './pageShell.module.css'

export function QuizPage() {
  return (
    <div className={shell.wrap}>
      <h1 className={shell.title}>Quiz</h1>
      <p className={shell.lead}>
        Multiple choice and fill-in-the-blank quizzes will be available in Phase
        9.
      </p>
    </div>
  )
}
