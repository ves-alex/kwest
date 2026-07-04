import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X, Play, Pause, SkipForward, Plus, Minus } from 'lucide-react'
import { REST_DURATION_KEY } from '../../storage/keys'
import { unlockAudio, playHammerStrike } from '../../lib/sound'

const PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '1 min 30', seconds: 90 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
]

// Géométrie de l'anneau de progression de la pastille
const RING_R = 34
const RING_C = 2 * Math.PI * RING_R

function loadLastDuration() {
  try { return parseInt(localStorage.getItem(REST_DURATION_KEY), 10) || 90 } catch { return 90 }
}
function saveLastDuration(d) {
  try { localStorage.setItem(REST_DURATION_KEY, String(d)) } catch {}
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
  const [expanded, setExpanded] = useState(false) // panneau de réglage ouvert ?

  const intervalRef = useRef(null)
  const autoCloseRef = useRef(null)
  const constraintsRef = useRef(null)
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

  // Reset + autoStart quand on ouvre.
  // Validation d'une série → pastille qui compte directement (autoStart).
  // Bouton manuel → panneau de réglage déplié pour choisir la durée.
  useEffect(() => {
    if (isOpen) {
      const d = loadLastDuration()
      setDuration(d)
      setRemaining(d)
      setFlashing(false)
      setCustomInput('')
      clearAutoClose()
      setRunning(autoStart)
      setExpanded(false) // toujours la pastille en premier, jamais le panneau
      unlockAudio() // le tap d'ouverture vient de débloquer l'audio
    } else {
      clearInterval(intervalRef.current)
      setRunning(false)
      setExpanded(false)
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
          setExpanded(false)
          navigator.vibrate?.([300, 100, 300]) // Android uniquement
          playHammerStrike() // coup d'enclume — signal fiable sur iPhone
          setTimeout(() => setFlashing(false), 1200)
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

  const toggleRunning = () => {
    unlockAudio()
    setRunning((r) => {
      const next = !r
      if (next) setExpanded(false) // on démarre → replie en pastille pour dégager l'écran
      return next
    })
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

  const openPanel = () => {
    unlockAudio()
    if (isDone) { handleClose(); return } // pastille terminée → tap = fermer
    setExpanded(true)
  }

  const progress = duration > 0 ? remaining / duration : 0
  const isDone = remaining === 0

  if (!isOpen) return null

  return (
    // Conteneur non-bloquant : laisse passer les taps vers la séance derrière.
    // Seuls la pastille et le panneau réactivent les pointer-events.
    <div
      ref={constraintsRef}
      className="pointer-events-none fixed inset-0 z-50"
    >
      {/* Flash de fin (léger, non bloquant) */}
      <AnimatePresence>
        {flashing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-glow/15"
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* ---------- PASTILLE FLOTTANTE ---------- */}
      <motion.button
        type="button"
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.12}
        onTap={openPanel}
        whileTap={{ scale: 0.94 }}
        animate={{
          opacity: expanded ? 0 : 1,
          scale: isDone ? [1, 1.08, 1] : expanded ? 0.5 : 1,
        }}
        transition={
          isDone
            ? { scale: { duration: 0.9, repeat: Infinity }, opacity: { duration: 0.25 } }
            : { duration: 0.25, ease: 'easeOut' }
        }
        style={{ pointerEvents: expanded ? 'none' : 'auto' }}
        aria-label="Timer de repos"
        className="pointer-events-auto absolute bottom-24 right-4 flex h-20 w-20 cursor-grab touch-none items-center justify-center rounded-full border border-forge-light bg-forge/95 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.7)] backdrop-blur-sm active:cursor-grabbing"
      >
        {/* Anneau de progression */}
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={RING_R} fill="none" stroke="#2A2420" strokeWidth="4" />
          <circle
            cx="40"
            cy="40"
            r={RING_R}
            fill="none"
            stroke={isDone ? '#92400E' : '#7C2D12'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className={`font-display text-xl tracking-wider ${isDone ? 'text-glow' : running ? 'text-ember' : 'text-ash'}`}>
          {isDone ? '✓' : fmt(remaining)}
        </span>
      </motion.button>

      {/* ---------- PANNEAU DE RÉGLAGE (déplié au tap) ---------- */}
      <AnimatePresence>
        {expanded && !isDone && (
          <>
            {/* Voile léger cliquable pour replier */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="pointer-events-auto absolute inset-0"
              aria-hidden
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="pointer-events-auto absolute inset-x-4 bottom-24 mx-auto max-w-sm rounded-2xl border border-forge-light bg-forge p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-ash">Timer de repos</p>
                  <span className="rounded-full bg-charcoal px-2 py-0.5 text-[9px] uppercase tracking-[0.2em]">
                    <StateLabel running={running} remaining={remaining} duration={duration} />
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-ash transition-colors hover:text-cream"
                  aria-label="Replier"
                >
                  <X size={16} />
                </button>
              </div>

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
                <p className="font-display text-6xl tracking-wider text-ember">{fmt(remaining)}</p>
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
                  onClick={toggleRunning}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Indice de fin sous la pastille */}
      <AnimatePresence>
        {isDone && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-[11.5rem] right-4 w-20 text-center text-[9px] uppercase tracking-[0.2em] text-glow"
          >
            {autoCloseIn !== null ? `${autoCloseIn}s` : 'Repos fini'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
