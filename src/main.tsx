import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/Toast/Toast.tsx'
import { AppProvider } from './context/AppProvider.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

/** Bootstrap the React tree, with graceful fallback messages if the root element is missing or render fails. */
function mount(): void {
  const rootEl = document.getElementById('root')
  if (!rootEl) {
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<p style="padding:1rem;font-family:system-ui">Missing #root — check index.html.</p>',
    )
    return
  }

  try {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <ToastProvider>
            <AppProvider>
              <App />
            </AppProvider>
          </ToastProvider>
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    rootEl.textContent = ''
    const pre = document.createElement('pre')
    pre.style.cssText =
      'padding:2rem;font-family:system-ui;white-space:pre-wrap;color:#111'
    pre.textContent = `Failed to start the app: ${msg}`
    rootEl.appendChild(pre)
    console.error(e)
  }
}

mount()
