import { useState } from 'react'
import { motion } from 'motion/react'
import { Anvil, Check, BookMarked } from 'lucide-react'
import CountUp from '../../components/ui/CountUp'
import { computeLevel, RUNE_SYMBOL } from '../../domain/economy'
import { findBadgeById } from '../../domain/badges'
import { findExerciseById } from '../../domain/exercises'
import { updateSessionRpe } from '../../storage/sessions'
import { saveRoutine, buildRoutine, loadRoutines } from '../../storage/routines'

// Écran affiché quand une séance a été abandonnée (timer-only < 5 min)
function AbandonedRecap({ onClose }) {
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
        onClick={onClose}
        className="mt-10 inline-flex items-center gap-2 rounded-md border border-forge-light bg-transparent px-8 py-3 text-sm uppercase tracking-[0.25em] text-ash transition-colors hover:border-ash hover:text-cream"
      >
        Fermer
      </button>
    </motion.div>
  )
}

const RPE_OPTIONS = [
  { v: 1, label: 'Facile' },
  { v: 2, label: 'Modéré' },
  { v: 3, label: 'Dur' },
  { v: 4, label: 'Très dur' },
  { v: 5, label: 'Limite' },
]

export default function SessionRecap({ recap, setRecap, onClose, onRoutinesChange }) {
  const [saveRoutineState, setSaveRoutineState] = useState('idle')
  const [routineName, setRoutineName] = useState('')

  if (recap.abandoned) return <AbandonedRecap onClose={onClose} />

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
    onRoutinesChange?.(loadRoutines())
    setSaveRoutineState('saved')
  }

  const handleSetRpe = (v) => {
    updateSessionRpe(recap.sessionId, v)
    setRecap((prev) => ({ ...prev, rpe: v }))
  }

  const newLvl = computeLevel(recap.newXp)
  const range = newLvl.nextThreshold ? newLvl.nextThreshold - newLvl.currentMin : 0
  const oldPct = range > 0 ? Math.max(0, Math.min(1, (recap.oldXp - newLvl.currentMin) / range)) : 0
  const newPct = newLvl.progress

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

      {newLvl.nextThreshold && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 w-full max-w-xs"
        >
          <div className="flex items-baseline justify-between text-[9px] uppercase tracking-[0.25em] text-ash/60">
            <span>Niveau {newLvl.level}</span>
            <span className="font-mono">
              {recap.newXp} / {newLvl.nextThreshold}
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-charcoal">
            <motion.div
              initial={{ width: `${oldPct * 100}%` }}
              animate={{ width: `${newPct * 100}%` }}
              transition={{ delay: 0.9, duration: 1, ease: [0.25, 0, 0, 1] }}
              className="h-full bg-ember"
            />
          </div>
        </motion.div>
      )}

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
                    {e.bestWeight > 0 ? `${e.bestWeight} kg × ${e.bestReps}` : `${e.bestReps} reps`}
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

      {!recap.isTimerOnly && recap.totalSets > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: recap.newBadges?.length ? 1.16 + recap.newBadges.length * 0.12 : 1.1 }}
          className="mt-8 w-full max-w-xs"
        >
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-ash">
            Comment tu te sens ?
          </p>
          <div className="mt-3 flex justify-between gap-1.5">
            {RPE_OPTIONS.map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => handleSetRpe(v)}
                className={`flex-1 rounded-md border px-1 py-2 text-[9px] uppercase tracking-[0.1em] transition-colors ${
                  recap.rpe === v
                    ? 'border-ember bg-ember/15 text-cream'
                    : 'border-forge-light bg-transparent text-ash hover:border-ash/60'
                }`}
                aria-pressed={recap.rpe === v}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: recap.newBadges?.length ? 0.82 + recap.newBadges.length * 0.12 : 0.78 }}
        onClick={onClose}
        className="mt-6 inline-flex items-center gap-2 rounded-md border border-ember bg-forge px-8 py-3 text-sm uppercase tracking-[0.25em] text-cream transition-all hover:bg-ember/20 hover:shadow-[0_0_24px_-8px_rgba(146,64,14,0.8)] active:scale-95"
      >
        Continuer
      </motion.button>
    </div>
  )
}
