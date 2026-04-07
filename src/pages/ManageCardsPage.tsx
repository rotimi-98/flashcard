import shell from './pageShell.module.css'

export function ManageCardsPage() {
  return (
    <div className={shell.wrap}>
      <h1 className={shell.title}>Manage cards</h1>
      <p className={shell.lead}>
        Add, edit, and search your vocabulary here. Coming in Phase 5.
      </p>
    </div>
  )
}
