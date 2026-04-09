import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/study', label: 'Study' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/cards', label: 'Cards' },
  { to: '/stats', label: 'Stats' },
  { to: '/settings', label: '⚙ Settings' },
]

export function Navbar() {
  return (
    <header>
      <nav className={styles.nav} aria-label="Main navigation">
        <ul className={styles.list}>
          {LINKS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={!!end}
                className={({ isActive }) =>
                  [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
