import { useCallback } from 'react'
import { useApp } from '../context/useApp.ts'
import { useSpeech } from '../hooks/useSpeech.ts'
import type { AppSettings } from '../types/index.ts'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const { state, dispatch } = useApp()
  const { settings } = state
  const { isSupported, availableVoices } = useSpeech(settings)

  const update = useCallback(
    (patch: Partial<AppSettings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: patch })
    },
    [dispatch],
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Settings</h1>

      {/* ---- Speech ---- */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Text-to-Speech</h2>

        {!isSupported && (
          <div className={styles.notice} role="status">
            Your browser does not support the Web Speech API. All
            text-to-speech features are unavailable.
          </div>
        )}

        <div className={styles.row}>
          <div>
            <p className={styles.rowLabel}>Enable speech</p>
            <p className={styles.rowDesc}>
              Play pronunciation audio on speaker buttons
            </p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${settings.speechEnabled ? styles.toggleOn : ''}`}
            role="switch"
            aria-checked={settings.speechEnabled}
            aria-label="Enable speech"
            onClick={() => update({ speechEnabled: !settings.speechEnabled })}
          />
        </div>

        <div className={styles.row}>
          <div>
            <p className={styles.rowLabel}>Speech rate</p>
            <p className={styles.rowDesc}>0.5× to 1.5×</p>
          </div>
          <div className={styles.sliderRow}>
            <input
              type="range"
              className={styles.slider}
              min={0.5}
              max={1.5}
              step={0.05}
              value={settings.speechRate}
              onChange={(e) =>
                update({ speechRate: parseFloat(e.target.value) })
              }
              aria-label="Speech rate"
            />
            <span className={styles.sliderValue}>
              {settings.speechRate.toFixed(2)}×
            </span>
          </div>
        </div>

        {isSupported && availableVoices.length > 0 && (
          <div className={styles.row}>
            <div>
              <p className={styles.rowLabel}>Voice</p>
              <p className={styles.rowDesc}>
                Select a preferred speech voice
              </p>
            </div>
            <select
              className={styles.select}
              value={settings.speechVoice ?? ''}
              onChange={(e) =>
                update({
                  speechVoice: e.target.value || undefined,
                })
              }
              aria-label="Speech voice"
            >
              <option value="">System default</option>
              {availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ---- Study ---- */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Study Mode</h2>

        <div className={styles.row}>
          <div>
            <p className={styles.rowLabel}>Auto-flip</p>
            <p className={styles.rowDesc}>
              Automatically flip cards after a delay
            </p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${settings.autoFlip ? styles.toggleOn : ''}`}
            role="switch"
            aria-checked={settings.autoFlip}
            aria-label="Auto-flip cards"
            onClick={() => update({ autoFlip: !settings.autoFlip })}
          />
        </div>

        <div className={styles.row}>
          <div>
            <p className={styles.rowLabel}>Auto-flip delay</p>
            <p className={styles.rowDesc}>
              Seconds before card flips (1–10)
            </p>
          </div>
          <input
            type="number"
            className={styles.numberInput}
            min={1}
            max={10}
            value={settings.autoFlipDelay}
            disabled={!settings.autoFlip}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (v >= 1 && v <= 10) update({ autoFlipDelay: v })
            }}
            aria-label="Auto-flip delay in seconds"
          />
        </div>
      </div>
    </div>
  )
}
