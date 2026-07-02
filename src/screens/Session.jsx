import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Flame, X, Plus, Trash2, Anvil, Check, BookMarked, ListPlus } from 'lucide-react'
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
import { evaluateBadges } from '../domain/badges'
import { findExerciseById, EQUIPMENT } from '../domain/exercises'
import ExerciseThumb from '../components/ui/ExerciseThumb'
import RestTimer from '../components/ui/RestTimer'
import ConfirmModal from '../components/ui/ConfirmModal'
import { loadRoutines } from '../storage/routines'
import { formatStartedAt, formatElapsed } from '../lib/format'
import SessionRecap from './session/SessionRecap'
import RoutinePicker from './session/RoutinePicker'

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

  const handleCancel = () => setShowCancelConfirm(true)

  const confirmCancel = () => {
    clearActiveSession()
    setActive(null)
    setShowCancelConfirm(false)
  }

  const handleRemoveEntry = (index) => setActive(removeEntryFromActiveSession(index))

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

  const handleFinish = () => setShowFinishConfirm(true)

  const confirmFinish = () => {
    setShowFinishConfirm(false)
    const finished = { ...active, endedAt: new Date().toISOString() }
    const isTimerOnly = finished.entries.length === 0
    const durationMin = (new Date(finished.endedAt) - new Date(finished.startedAt)) / 60000

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
      sessionId: finished.id,
      runes,
      xp,
      levelUp: newLevel.level > oldLevel.level,
      newLevel: newLevel.level,
      newTitle: newLevel.title,
      oldXp: oldPlayer.totalXp,
      newXp: playerAfterGains.totalXp,
      newBadges: justUnlocked,
      isTimerOnly,
      durationMin: Math.round(durationMin),
      totalExos,
      totalSets,
      totalVolume,
      exerciseSummary,
      exerciseIds: finished.entries.map((e) => e.exerciseId),
      rpe: null,
    })
  }

  const handleCloseRecap = () => setRecap(null)

  const handleStartFromRoutine = (routine) => {
    const s = createSession()
    s.entries = routine.exerciseIds.map((id) => ({ exerciseId: id, sets: [] }))
    saveActiveSession(s)
    setActive(s)
    setRoutinePickerOpen(false)
  }

  // --- Écran récap (normal ou abandonné) ---
  if (recap) {
    return (
      <SessionRecap
        recap={recap}
        setRecap={setRecap}
        onClose={handleCloseRecap}
        onRoutinesChange={setRoutines}
      />
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
          <Link
            to="/routines/new"
            className="mt-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-ash/60 transition-colors hover:text-cream"
          >
            <ListPlus size={12} />
            {routines.length === 0 ? 'Créer ta première routine' : 'Créer une nouvelle routine'}
          </Link>
        </div>

        <RoutinePicker
          isOpen={routinePickerOpen}
          routines={routines}
          onClose={() => setRoutinePickerOpen(false)}
          onStart={handleStartFromRoutine}
          onChange={setRoutines}
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
          const currentBest = entry.sets.reduce((max, s) => {
            const w = parseFloat(s.weight) || 0
            return w > max ? w : max
          }, 0)
          let prHint = null
          if (pr && currentBest > 0) {
            const diff = pr.weight - currentBest
            if (diff > 0) prHint = `à ${diff}kg`
            else if (diff === 0) prHint = 'à égaler'
            else prHint = `+${-diff}kg !`
          }
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
                        {prHint && (
                          <span className={prHint.startsWith('+') ? 'ml-1 font-medium text-glow' : 'ml-1 text-ember/50'}>
                            · {prHint}
                          </span>
                        )}
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
                    )
                  })}
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
