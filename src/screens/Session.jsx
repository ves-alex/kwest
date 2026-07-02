import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Flame, X, Plus, Trash2, Anvil, Check, BookMarked, Pencil } from 'lucide-react'
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  createSession,
  saveSession,
  loadSessions,
  removeEntryFromActiveSession,
  addSetToEntry,
  updateSetInEntry,
  removeSetFromEntry,
  getLastPerformance,
  getPersonalRecord,
} from '../storage/sessions'
import { loadPlayer, savePlayer } from '../storage/player'
import { computeLevel, RUNE_SYMBOL } from '../domain/economy'
import { evaluateBadges, findBadgeById } from '../domain/badges'
import { findExerciseById, EQUIPMENT } from '../domain/exercises'
import ExerciseThumb from '../components/ui/ExerciseThumb'
import RestTimer from '../components/ui/RestTimer'
import ConfirmModal from '../components/ui/ConfirmModal'
import { loadRoutines, saveRoutine, deleteRoutine, buildRoutine } from '../storage/routines'

function CountUp({ to, delay = 0, duration = 1.2 }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!to) return
    const timer = setTimeout(() => {
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min((now - start) / (duration * 1000), 1)
        setValue(Math.round((1 - Math.pow(2, -10 * t)) * to))
        if (t < 1) requestAnimationFrame(tick)
        else setValue(to)
      }
      requestAnimationFrame(tick)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [to, delay, duration])
  return value
}

function formatStartedAt(iso) {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatElapsed(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function Session() {
  const [active, setActive] = useState(loadActiveSession)
  const [recap, setRecap] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [restAutoStart, setRestAutoStart] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  // Historique chargé une fois au montage pour les hints "dernière perf"
  const [historySessions] = useState(() => loadSessions())
  const [routinePickerOpen, setRoutinePickerOpen] = useState(false)
  const [routines, setRoutines] = useState(loadRoutines)
  const [saveRoutineState, setSaveRoutineState] = useState('idle') // 'idle' | 'editing' | 'saved'
  const [routineName, setRoutineName] = useState('')
  const [pendingDeleteRoutineId, setPendingDeleteRoutineId] = useState(null)
  const [editingRoutineId, setEditingRoutineId] = useState(null)
  const [editingRoutineName, setEditingRoutineName] = useState('')

  const exercisePerfs = useMemo(() => {
    if (!active) return {}
    const map = {}
    for (const entry of active.entries) {
      if (!map[entry.exerciseId]) {
        map[entry.exerciseId] = {
          lastPerf: getLastPerformance(entry.exerciseId, historySessions),
          pr: getPersonalRecord(entry.exerciseId, historySessions),
        }
      }
    }
    return map
  }, [active, historySessions])

  useEffect(() => {
    if (!active) { setElapsed(0); return }
    const start = new Date(active.startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [active?.id])

  const handleStart = () => {
    const s = createSession()
    saveActiveSession(s)
    setActive(s)
  }

  const handleCancel = () => {
    setShowCancelConfirm(true)
  }

  const confirmCancel = () => {
    clearActiveSession()
    setActive(null)
    setShowCancelConfirm(false)
  }

  const handleRemoveEntry = (index) => {
    setActive(removeEntryFromActiveSession(index))
  }

  const handleAddSet = (entryIndex) => {
    const entry = active.entries[entryIndex]
    const lastSet = entry.sets[entry.sets.length - 1]
    const defaults = lastSet ? { reps: lastSet.reps, weight: lastSet.weight } : {}
    setActive(addSetToEntry(entryIndex, defaults))
  }

  const handleUpdateSet = (entryIndex, setIndex, patch) => {
    setActive(updateSetInEntry(entryIndex, setIndex, patch))
  }

  const handleRemoveSet = (entryIndex, setIndex) => {
    setActive(removeSetFromEntry(entryIndex, setIndex))
  }

  const handleValidateSet = (entryIndex, setIndex) => {
    const set = active.entries[entryIndex].sets[setIndex]
    setActive(updateSetInEntry(entryIndex, setIndex, { validated: !set.validated }))
    if (!set.validated) {
      setRestAutoStart(true)
      setShowRestTimer(true)
    }
  }

  const handleFinish = () => {
    setShowFinishConfirm(true)
  }

  const confirmFinish = () => {
    setShowFinishConfirm(false)
    const finished = { ...active, endedAt: new Date().toISOString() }
    const isTimerOnly = finished.entries.length === 0
    const durationMin = (new Date(finished.endedAt) - new Date(finished.startedAt)) / 60000

    // Séance trop courte sans exercice = abandonnée
    if (isTimerOnly && durationMin < 5) {
      clearActiveSession()
      setActive(null)
      setRecap({ abandoned: true })
      return
    }

    const isCounted = (s) => s.validated !== false
    const totalExos = finished.entries.filter((e) => e.sets.some(isCounted)).length
    const totalSets = finished.entries.reduce(
      (acc, e) => acc + e.sets.filter(isCounted).length,
      0
    )
    const totalVolume = Math.round(
      finished.entries.reduce(
        (total, e) =>
          total +
          e.sets.reduce(
            (acc, s) => (isCounted(s) ? acc + (parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0) : acc),
            0
          ),
        0
      )
    )
    const exerciseSummary = finished.entries
      .map((e) => {
        const validSets = e.sets.filter((s) => isCounted(s) && parseFloat(s.reps) > 0)
        if (validSets.length === 0) return null
        const best = validSets.reduce((b, s) => {
          const vol = (parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0)
          const bvol = (parseFloat(b.reps) || 0) * (parseFloat(b.weight) || 0)
          return vol >= bvol ? s : b
        }, validSets[0])
        return {
          exerciseId: e.exerciseId,
          sets: validSets.length,
          bestReps: best.reps,
          bestWeight: parseFloat(best.weight) || 0,
        }
      })
      .filter(Boolean)

    const oldPlayer = loadPlayer()
    const oldLevel = computeLevel(oldPlayer.totalXp)
    const oldBadges = new Set(oldPlayer.badgesUnlocked ?? [])

    // Écrire la session d'abord — loadPlayer() recalcule ensuite les totaux depuis les sessions
    saveSession(finished)

    const allSessions = loadSessions()
    const playerAfterGains = loadPlayer()
    const runes = Math.max(0, playerAfterGains.totalRunes - oldPlayer.totalRunes)
    const xp = Math.max(0, playerAfterGains.totalXp - oldPlayer.totalXp)
    const unlockedNow = evaluateBadges(playerAfterGains, allSessions)
    const justUnlocked = unlockedNow.filter((id) => !oldBadges.has(id))
    if (justUnlocked.length > 0) {
      savePlayer({ ...playerAfterGains, badgesUnlocked: unlockedNow })
    }

    const newLevel = computeLevel(playerAfterGains.totalXp)
    clearActiveSession()
    setActive(null)
    setRecap({
      runes,
      xp,
      levelUp: newLevel.level > oldLevel.level,
      newLevel: newLevel.level,
      newTitle: newLevel.title,
      newBadges: justUnlocked,
      isTimerOnly,
      durationMin: Math.round(durationMin),
      totalExos,
      totalSets,
      totalVolume,
      exerciseSummary,
      exerciseIds: finished.entries.map((e) => e.exerciseId),
    })
  }

  const handleCloseRecap = () => {
    setRecap(null)
    setSaveRoutineState('idle')
    setRoutineName('')
  }

  const handleStartFromRoutine = (routine) => {
    const s = createSession()
    s.entries = routine.exerciseIds.map((id) => ({ exerciseId: id, sets: [] }))
    saveActiveSession(s)
    setActive(s)
    setRoutinePickerOpen(false)
  }

  const confirmDeleteRoutine = () => {
    if (!pendingDeleteRoutineId) return
    deleteRoutine(pendingDeleteRoutineId)
    setRoutines(loadRoutines())
    setPendingDeleteRoutineId(null)
  }

  const handleRenameRoutine = (id, newName) => {
    const r = routines.find((rt) => rt.id === id)
    if (!r) return
    saveRoutine({ ...r, name: newName.trim() || r.name })
    setRoutines(loadRoutines())
    setEditingRoutineId(null)
    setEditingRoutineName('')
  }

  const handleOpenSaveRoutine = () => {
    const defaultName = (recap.exerciseIds ?? [])
      .slice(0, 2)
      .map((id) => findExerciseById(id)?.name ?? id)
      .join(' + ')
      .slice(0, 40)
    setRoutineName(defaultName)
    setSaveRoutineState('editing')
  }

  const handleSaveRoutine = () => {
    const exoIds = recap.exerciseIds ?? []
    if (exoIds.length === 0) return
    const r = buildRoutine(routineName.trim() || 'Ma routine', exoIds)
    saveRoutine(r)
    setRoutines(loadRoutines())
    setSaveRoutineState('saved')
  }

  // --- Écran récap abandonné ---
  if (recap?.abandoned) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">séance abandonnée</p>
        <p className="mt-6 font-display text-3xl uppercase tracking-[0.1em] text-ash">Trop courte</p>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash/70">
          Moins de 5 min sans exercice. Aucune rune forgée.
        </p>
        <button
          type="button"
          onClick={handleCloseRecap}
          className="mt-10 inline-flex items-center gap-2 rounded-md border border-forge-light bg-transparent px-8 py-3 text-sm uppercase tracking-[0.25em] text-ash transition-colors hover:border-ash hover:text-cream"
        >
          Fermer
        </button>
      </motion.div>
    )
  }

  // --- Écran récap normal ---
  if (recap) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-[10px] uppercase tracking-[0.4em] text-ash"
        >
          {recap.isTimerOnly ? 'séance libre forgée' : 'séance forgée'}
        </motion.p>

        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 280, damping: 20 }}
          className="mt-6 flex h-16 w-16 items-center justify-center rounded-full border border-ember bg-forge"
        >
          <Anvil size={28} className="text-ember" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.45, ease: [0.25, 0, 0, 1] }}
          className="mt-8 font-display text-5xl tracking-wider text-ember"
        >
          +<CountUp to={recap.runes} delay={0.24} /> {RUNE_SYMBOL}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.38 }}
          className="mt-1 text-xs uppercase tracking-[0.3em] text-cream"
        >
          runes d'effort
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.35, ease: [0.25, 0, 0, 1] }}
          className="mt-6 font-display text-2xl tracking-wider text-cream"
        >
          +<CountUp to={recap.xp} delay={0.48} /> XP
        </motion.p>

        {!recap.isTimerOnly && recap.totalSets > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58 }}
            className={`mt-5 grid w-full max-w-xs gap-2 ${recap.totalVolume > 0 ? 'grid-cols-2' : 'grid-cols-3'}`}
          >
            {recap.totalExos > 0 && (
              <div className="rounded-xl border border-forge-light bg-forge px-3 py-2.5 text-left">
                <p className="text-[9px] uppercase tracking-[0.2em] text-ash">Exercices</p>
                <p className="mt-1 font-display text-3xl text-cream">{recap.totalExos}</p>
              </div>
            )}
            <div className="rounded-xl border border-forge-light bg-forge px-3 py-2.5 text-left">
              <p className="text-[9px] uppercase tracking-[0.2em] text-ash">Séries</p>
              <p className="mt-1 font-display text-3xl text-cream">{recap.totalSets}</p>
            </div>
            {recap.totalVolume > 0 && (
              <div className="rounded-xl border border-forge-light bg-forge px-3 py-2.5 text-left">
                <p className="text-[9px] uppercase tracking-[0.2em] text-ash">Volume</p>
                <p className="mt-1 font-display text-3xl text-cream">
                  {recap.totalVolume}
                  <span className="ml-1 font-sans text-base text-ash">kg</span>
                </p>
              </div>
            )}
            <div className="rounded-xl border border-forge-light bg-forge px-3 py-2.5 text-left">
              <p className="text-[9px] uppercase tracking-[0.2em] text-ash">Durée</p>
              <p className="mt-1 font-display text-3xl text-cream">
                {recap.durationMin}
                <span className="ml-1 font-sans text-base text-ash">min</span>
              </p>
            </div>
          </motion.div>
        )}
        {recap.isTimerOnly && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58 }}
            className="mt-2 text-[10px] uppercase tracking-[0.3em] text-ash"
          >
            {recap.durationMin} min · séance sans exercices
          </motion.p>
        )}

        {recap.levelUp && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.68, type: 'spring', stiffness: 240, damping: 24 }}
            className="mt-8 w-full max-w-xs rounded-xl border border-ember bg-forge p-4 shadow-[0_0_32px_-8px_rgba(124,45,18,0.7)]"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Nouveau palier</p>
            <p className="mt-2 font-display text-2xl uppercase tracking-wider text-cream">
              {recap.newTitle}
            </p>
            <p className="mt-1 text-xs text-ash">Niveau {recap.newLevel}</p>
          </motion.div>
        )}

        {recap.newBadges?.length > 0 && (
          <div className="mt-6 w-full max-w-xs space-y-2">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="text-center text-[10px] uppercase tracking-[0.3em] text-ash"
            >
              {recap.newBadges.length === 1 ? 'Badge débloqué' : `${recap.newBadges.length} badges débloqués`}
            </motion.p>
            {recap.newBadges.map((id, i) => {
              const b = findBadgeById(id)
              if (!b) return null
              const Icon = b.Icon
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.82 + i * 0.12, duration: 0.35 }}
                  className="flex items-center gap-3 rounded-xl border border-glow bg-forge p-3 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-glow bg-charcoal">
                    <Icon size={18} className="text-glow" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cream">{b.name}</p>
                    <p className="text-[10px] text-ash">{b.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {recap.exerciseSummary?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: recap.newBadges?.length ? 0.92 + recap.newBadges.length * 0.12 : 0.86 }}
            className="mt-6 w-full max-w-xs text-left"
          >
            <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ash">Détail</p>
            <div className="space-y-1">
              {recap.exerciseSummary.map((e) => {
                const exo = findExerciseById(e.exerciseId)
                if (!exo) return null
                return (
                  <div
                    key={e.exerciseId}
                    className="flex items-center justify-between rounded-lg border border-forge-light bg-forge px-3 py-2"
                  >
                    <p className="truncate text-xs text-cream">{exo.name}</p>
                    <p className="ml-3 shrink-0 font-mono text-[10px] text-ash">
                      {e.bestWeight > 0
                        ? `${e.bestWeight} kg × ${e.bestReps}`
                        : `${e.bestReps} reps`}
                      {' · '}{e.sets}×
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {!recap.isTimerOnly && (recap.exerciseIds?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: recap.newBadges?.length ? 1.04 + recap.newBadges.length * 0.12 : 0.98 }}
            className="mt-8 w-full max-w-xs"
          >
            {saveRoutineState === 'saved' ? (
              <p className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-glow">
                <Check size={11} />
                Routine enregistrée
              </p>
            ) : saveRoutineState === 'editing' ? (
              <div className="rounded-xl border border-forge-light bg-forge p-3">
                <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ash">Nom de la routine</p>
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="Ma routine"
                  className="w-full rounded-md border border-forge-light bg-charcoal px-3 py-2 text-sm text-cream placeholder:text-ash/50 focus:border-ember focus:outline-none"
                  autoFocus
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveRoutine}
                    className="flex-1 rounded-md border border-ember bg-transparent py-1.5 text-[10px] uppercase tracking-[0.2em] text-cream transition-colors hover:bg-ember/15"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveRoutineState('idle')}
                    className="rounded-md border border-forge-light px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-ash transition-colors hover:border-ash/60"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenSaveRoutine}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-forge-light bg-transparent py-2.5 text-[10px] uppercase tracking-[0.2em] text-ash transition-colors hover:border-ash/60 hover:text-cream"
              >
                <BookMarked size={12} />
                Garder comme routine
              </button>
            )}
          </motion.div>
        )}

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: recap.newBadges?.length ? 0.82 + recap.newBadges.length * 0.12 : 0.78 }}
          onClick={handleCloseRecap}
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-ember bg-forge px-8 py-3 text-sm uppercase tracking-[0.25em] text-cream transition-all hover:bg-ember/20 hover:shadow-[0_0_24px_-8px_rgba(146,64,14,0.8)] active:scale-95"
        >
          Continuer
        </motion.button>
      </div>
    )
  }

  // --- Écran initial (pas de séance) ---
  if (!active) {
    return (
      <>
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-ash">aucune séance en cours</p>
          <h1 className="mt-4 font-display text-4xl uppercase tracking-[0.15em] text-cream sm:text-5xl sm:tracking-[0.2em]">
            Séance
          </h1>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ash">
            Prêt à forger ? Lance une nouvelle séance, ajoute tes exercices au fil de l'entraînement.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="mt-10 inline-flex items-center gap-3 rounded-md border border-ember bg-forge px-6 py-3.5 text-sm uppercase tracking-[0.25em] text-cream transition-all hover:bg-ember/20 hover:shadow-[0_0_24px_-8px_rgba(146,64,14,0.8)] active:scale-95"
          >
            <Flame size={18} className="text-ember" />
            Démarrer une séance
          </button>
          {routines.length > 0 && (
            <button
              type="button"
              onClick={() => setRoutinePickerOpen(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-forge-light bg-transparent px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:border-ash/60 hover:text-cream"
            >
              <BookMarked size={13} />
              Depuis une routine
            </button>
          )}
        </div>

        {/* Routine picker — bottom sheet */}
        <AnimatePresence>
          {routinePickerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-charcoal/80 backdrop-blur-sm"
              onClick={() => setRoutinePickerOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-forge-light bg-forge px-6 pb-16 pt-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Mes routines</p>
                  <button
                    type="button"
                    onClick={() => setRoutinePickerOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-forge-light text-ash transition-colors hover:border-ember hover:text-ember"
                    aria-label="Fermer"
                  >
                    <X size={13} />
                  </button>
                </div>
                <ul className="space-y-2">
                  {routines.map((r) => (
                    <li key={r.id} className="flex items-center gap-3">
                      {editingRoutineId === r.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingRoutineName}
                          onChange={(e) => setEditingRoutineName(e.target.value)}
                          onBlur={() => handleRenameRoutine(r.id, editingRoutineName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameRoutine(r.id, editingRoutineName)
                            if (e.key === 'Escape') { setEditingRoutineId(null); setEditingRoutineName('') }
                          }}
                          className="flex-1 rounded-xl border border-ember bg-charcoal/40 px-4 py-3 text-sm text-cream focus:outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartFromRoutine(r)}
                          className="flex min-w-0 flex-1 flex-col rounded-xl border border-forge-light bg-charcoal/40 px-4 py-3 text-left transition-colors hover:border-ember"
                        >
                          <p className="text-sm font-medium text-cream">{r.name}</p>
                          <p className="mt-0.5 text-[10px] text-ash/60">
                            {r.exerciseIds.length} exercice{r.exerciseIds.length > 1 ? 's' : ''}
                            {' · '}
                            {r.exerciseIds
                              .slice(0, 2)
                              .map((id) => findExerciseById(id)?.name ?? id)
                              .join(', ')}
                            {r.exerciseIds.length > 2 ? '…' : ''}
                          </p>
                        </button>
                      )}
                      {editingRoutineId !== r.id && (
                        <button
                          type="button"
                          onClick={() => { setEditingRoutineId(r.id); setEditingRoutineName(r.name) }}
                          className="shrink-0 text-ash/40 transition-colors hover:text-cream"
                          aria-label={`Renommer ${r.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {editingRoutineId !== r.id && (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteRoutineId(r.id)}
                          className="shrink-0 text-ash/40 transition-colors hover:text-ember"
                          aria-label={`Supprimer ${r.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmModal
          isOpen={!!pendingDeleteRoutineId}
          title="Supprimer cette routine ?"
          message="Cette routine sera définitivement supprimée."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          danger
          onConfirm={confirmDeleteRoutine}
          onCancel={() => setPendingDeleteRoutineId(null)}
        />
      </>
    )
  }

  // --- Écran séance en cours ---
  return (
    <div className="px-6 py-10">
      <header className="mx-auto max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">séance en cours</p>
        <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.15em] text-cream sm:text-4xl">
          Séance
        </h1>
        <p className="mt-3 text-xs text-ash first-letter:uppercase">
          {formatStartedAt(active.startedAt)}
        </p>
        <p className="mt-2 font-mono text-2xl tracking-widest text-ember">
          {formatElapsed(elapsed)}
        </p>
      </header>

      <section className="mx-auto mt-10 max-w-md space-y-3">
        {active.entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-forge-light bg-forge/40 p-8 text-center">
            <p className="font-display text-5xl tracking-widest text-ember">
              {formatElapsed(elapsed)}
            </p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-ash">
              séance libre · ajoute des exercices ou termine pour gagner des runes
            </p>
          </div>
        )}

        {active.entries.map((entry, entryIndex) => {
          const exo = findExerciseById(entry.exerciseId)
          const lastPerf = exercisePerfs[entry.exerciseId]?.lastPerf ?? null
          const pr = exercisePerfs[entry.exerciseId]?.pr ?? null
          return (
            <article key={entryIndex} className="rounded-2xl border border-forge-light bg-forge p-4">
              <header className="flex items-start gap-3">
                {exo && <ExerciseThumb exerciseId={exo.id} />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-cream">{exo?.name ?? entry.exerciseId}</p>
                  {exo && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ash">
                      {EQUIPMENT[exo.equipment]}
                    </p>
                  )}
                  <div className="mt-0.5 flex flex-wrap gap-x-3">
                    {lastPerf && (
                      <p className="text-[10px] text-ash/60">
                        Dernière · {lastPerf.weight || '—'}kg × {lastPerf.reps || '—'}
                      </p>
                    )}
                    {pr && (
                      <p className="text-[10px] text-ember/70">
                        PR · {pr.weight}kg × {pr.reps}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveEntry(entryIndex)}
                  className="text-ash transition-colors hover:text-ember"
                  aria-label="Supprimer cet exercice"
                >
                  <Trash2 size={16} />
                </button>
              </header>

              {entry.sets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {entry.sets.map((set, setIndex) => {
                    const isNewPR = pr &&
                      (parseFloat(set.weight) || 0) > 0 &&
                      ((parseFloat(set.weight) || 0) > pr.weight ||
                       ((parseFloat(set.weight) || 0) === pr.weight && (parseFloat(set.reps) || 0) > pr.reps))
                    return (
                    <li
                      key={setIndex}
                      className={`flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors ${
                        set.validated ? 'bg-glow/8' : isNewPR ? 'bg-ember/8' : ''
                      }`}
                    >
                      <span className="w-4 shrink-0 text-center font-mono text-xs text-ash">
                        {setIndex + 1}
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={set.reps}
                        onChange={(e) => handleUpdateSet(entryIndex, setIndex, { reps: e.target.value })}
                        placeholder="reps"
                        className={`w-16 rounded-md border px-2 py-1.5 text-center text-base placeholder:text-ash/60 focus:border-ember focus:outline-none ${
                          set.validated
                            ? 'border-forge-light/50 bg-charcoal/50 text-ash'
                            : 'border-forge-light bg-charcoal text-cream'
                        }`}
                      />
                      <span className="text-xs text-ash">×</span>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          value={set.weight}
                          onChange={(e) => handleUpdateSet(entryIndex, setIndex, { weight: e.target.value })}
                          placeholder="poids"
                          className={`w-full rounded-md border px-2 py-1.5 pr-8 text-center text-base placeholder:text-ash/60 focus:border-ember focus:outline-none ${
                            set.validated
                              ? 'border-forge-light/50 bg-charcoal/50 text-ash'
                              : 'border-forge-light bg-charcoal text-cream'
                          }`}
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ash">
                          kg
                        </span>
                      </div>
                      {isNewPR && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-ember">
                          PR
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleValidateSet(entryIndex, setIndex)}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          set.validated
                            ? 'border-glow bg-glow/20 text-glow'
                            : 'border-forge-light bg-charcoal text-ash hover:border-glow hover:text-glow'
                        }`}
                        aria-label={set.validated ? 'Dévalider la série' : 'Valider la série'}
                      >
                        <Check size={14} strokeWidth={set.validated ? 2.5 : 1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(entryIndex, setIndex)}
                        className="text-ash transition-colors hover:text-ember"
                        aria-label={`Supprimer la série ${setIndex + 1}`}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  )})}

                </ul>
              )}

              <button
                type="button"
                onClick={() => handleAddSet(entryIndex)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-forge-light bg-transparent px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-ash transition-colors hover:border-ember hover:text-ember"
              >
                <Plus size={12} />
                Ajouter une série
              </button>
            </article>
          )
        })}

        <Link
          to="/session/picker"
          className="flex items-center justify-center gap-2 rounded-md border border-dashed border-forge-light bg-transparent px-4 py-3.5 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:border-ember hover:text-ember"
        >
          <Plus size={14} />
          Ajouter un exercice
        </Link>
      </section>

      <section className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => { setRestAutoStart(false); setShowRestTimer(true) }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-forge-light bg-transparent px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-ash transition-colors hover:border-ember hover:text-ember"
        >
          ⏱ Timer de repos
        </button>
        <button
          type="button"
          onClick={handleFinish}
          className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-ember bg-forge px-6 py-3.5 text-sm uppercase tracking-[0.25em] text-cream transition-all hover:bg-ember/20 hover:shadow-[0_0_24px_-8px_rgba(146,64,14,0.8)] active:scale-95"
        >
          <Anvil size={18} className="text-ember" />
          Terminer la séance
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-2 rounded-md border border-forge-light bg-transparent px-4 py-2 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:border-ash hover:text-cream"
        >
          <X size={14} />
          Annuler la séance
        </button>
      </section>

      <RestTimer
        isOpen={showRestTimer}
        autoStart={restAutoStart}
        onClose={() => { setShowRestTimer(false); setRestAutoStart(false) }}
      />

      <ConfirmModal
        isOpen={showFinishConfirm}
        title="Sceller la séance ?"
        message="Elle sera enregistrée dans tes chroniques et les runes forgées ajoutées à ton solde."
        confirmLabel="Sceller la séance"
        cancelLabel="Continuer à forger"
        onConfirm={confirmFinish}
        onCancel={() => setShowFinishConfirm(false)}
      />

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Abandonner la forge ?"
        message="Cette séance sera supprimée. Aucune rune ne sera forgée."
        confirmLabel="Abandonner"
        cancelLabel="Rester"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  )
}
