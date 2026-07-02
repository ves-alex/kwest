import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Play, Pause, SkipForward, Plus, Minus } from 'lucide-react'

const PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '1 min 30', seconds: 90 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
]

const STORAGE_KEY = 'kwest:rest-duration'

function loadLastDuration() {
  try { return parseInt(localStorage.getItem(STORAGE_KEY), 10) || 90 } catch { return 90 }
}
function saveLastDuration(d) {
  try { localStorage.setItem(STORAGE_KEY, String(d)) } catch {}
}

function fmt(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function StateLabel({ running, remaining, duration }) {
  if (remaining === 0) return <span className="text-glow">TERMINÉ</span>
  if (!running && remaining === duration) return <span className="text-ash">PRÊT</span>
  if (running) return <span className="text-ember">EN COURS</span>
  return <span className="text-ash">PAUSE</span>
}

export default function RestTimer({ isOpen, onClose, autoStart = false }) {
  const [duration, setDuration] = useState(loadLastDuration)
  const [remaining, setRemaining] = useState(() => loadLastDuration())
  const [running, setRunning] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [autoCloseIn, setAutoCloseIn] = useState(null)

  const intervalRef = useRef(null)
  const autoCloseRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const clearAutoClose = useCallback(() => {
    if (autoCloseRef.current) {
      clearInterval(autoCloseRef.current)
      autoCloseRef.current = null
    }
    setAutoCloseIn(null)
  }, [])

  const startAutoClose = useCallback(() => {
    let n = 5
    setAutoCloseIn(n)
    autoCloseRef.current = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(autoCloseRef.current)
        autoCloseRef.current = null
        setAutoCloseIn(null)
        onCloseRef.current()
      } else {
        setAutoCloseIn(n)
      }
    }, 1000)
  }, [])

  // Reset + autoStart quand on ouvre
  useEffect(() => {
    if (isOpen) {
      const d = loadLastDuration()
      setDuration(d)
      setRemaining(d)
      setFlashing(false)
      setCustomInput('')
      clearAutoClose()
      setRunning(autoStart)
    } else {
      clearInterval(intervalRef.current)
      setRunning(false)
      clearAutoClose()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown
  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          setFlashing(true)
          navigator.vibrate?.([300, 100, 300])
          setTimeout(() => setFlashing(false), 1000)
          startAutoClose()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, startAutoClose])

  const selectPreset = (seconds) => {
    setDuration(seconds)
    setRemaining(seconds)
    setRunning(false)
    setCustomInput('')
    clearAutoClose()
    saveLastDuration(seconds)
  }

  const adjustTime = (delta) => {
    setDuration((d) => {
      const next = Math.max(5, d + delta)
      saveLastDuration(next)
      return next
    })
    setRemaining((r) => Math.max(5, r + delta))
  }

  const applyCustom = () => {
    const v = parseInt(customInput, 10)
    if (v > 0) selectPreset(v)
  }

  const handleSkip = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    clearAutoClose()
    onClose()
  }

  const handleClose = () => {
    clearAutoClose()
    onClose()
  }

  const progress = duration > 0 ? remaining / duration : 0
  const isDone = remaining === 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm"
        onClick={isDone ? handleClose : undefined}
        aria-hidden
      />

      {/* Flash de fin */}
      {flashing && (
        <div
          className="pointer-events-none absolute inset-0 z-10 animate-pulse bg-glow/20"
          aria-hidden
        />
      )}

      {/* Panneau */}
      <div className="relative z-20 w-full max-w-sm rounded-2xl border border-forge-light bg-forge p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-ash">
              Timer de repos
            </p>
            <span className="rounded-full bg-charcoal px-2 py-0.5 text-[9px] uppercase tracking-[0.2em]">
              <StateLabel running={running} remaining={remaining} duration={duration} />
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-ash transition-colors hover:text-cream"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {isDone ? (
          /* Écran "terminé" */
          <div className="mt-6 text-center">
            <p className="font-display text-3xl uppercase tracking-[0.15em] text-glow">
              Repos terminé
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-ash">
              {autoCloseIn !== null
                ? `fermeture dans ${autoCloseIn}s`
                : 'reprends la forge'}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-ember bg-forge px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-cream transition-colors hover:bg-ember/20"
            >
              Retour à la forge
            </button>
          </div>
        ) : (
          <>
            {/* Presets */}
            <div className="mt-4 flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.seconds}
                  type="button"
                  onClick={() => selectPreset(p.seconds)}
                  className={`flex-1 rounded-md border px-1 py-1.5 text-[9px] uppercase tracking-[0.15em] transition-colors ${
                    duration === p.seconds && !customInput
                      ? 'border-ember bg-ember/20 text-cream'
                      : 'border-forge-light bg-transparent text-ash hover:border-ember hover:text-cream'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Ajustement +/-15s + custom */}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustTime(-15)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-forge-light text-ash transition-colors hover:border-ash hover:text-cream"
                aria-label="-15 secondes"
              >
                <Minus size={12} />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Custom (sec)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onBlur={applyCustom}
                onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
                className="flex-1 rounded-md border border-forge-light bg-charcoal px-3 py-1.5 text-center text-xs text-cream placeholder:text-ash/50 focus:border-ember focus:outline-none"
              />
              <button
                type="button"
                onClick={() => adjustTime(15)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-forge-light text-ash transition-colors hover:border-ash hover:text-cream"
                aria-label="+15 secondes"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Compte à rebours */}
            <div className="mt-6 text-center">
              <p className="font-display text-7xl tracking-wider text-ember">
                {fmt(remaining)}
              </p>
            </div>

            {/* Barre de progression */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-charcoal">
              <div
                className="h-full rounded-full bg-ember transition-all duration-1000"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Contrôles */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-ember bg-forge px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-cream transition-colors hover:bg-ember/20"
              >
                {running ? <Pause size={14} /> : <Play size={14} />}
                {running ? 'Pause' : 'Démarrer'}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-2 rounded-md border border-forge-light bg-transparent px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:border-ash hover:text-cream"
              >
                <SkipForward size={14} />
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
