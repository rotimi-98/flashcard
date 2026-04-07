import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar.tsx'
import styles from './Layout.module.css'

export function Layout() {
  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
