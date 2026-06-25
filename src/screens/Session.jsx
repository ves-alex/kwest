import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flame, X, Plus, Trash2, Anvil, Check } from 'lucide-react'
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
} from '../storage/sessions'
import { loadPlayer, savePlayer, addRunes, addXp } from '../storage/player'
import {
  computeSessionRunes,
  computeSessionXp,
  computeTimerRunes,
  computeTimerXp,
  computeLevel,
  RUNE_SYMBOL,
} from '../domain/economy'
import { evaluateBadges, findBadgeById } from '../domain/badges'
import { findExerciseById, EQUIPMENT } from '../domain/exercises'
import ExerciseThumb from '../components/ui/ExerciseThumb'
import RestTimer from '../components/ui/RestTimer'
import ConfirmModal from '../components/ui/ConfirmModal'

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

    const runes = isTimerOnly ? computeTimerRunes(durationMin) : computeSessionRunes(finished)
    const xp = isTimerOnly ? computeTimerXp(durationMin) : computeSessionXp(finished)

    const totalExos = finished.entries.length
    const totalSets = finished.entries.reduce((acc, e) => acc + e.sets.length, 0)
    const totalVolume = Math.round(
      finished.entries.reduce(
        (total, e) =>
          total +
          e.sets.reduce((acc, s) => acc + (parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0), 0),
        0
      )
    )

    const oldPlayer = loadPlayer()
    const oldLevel = computeLevel(oldPlayer.totalXp)
    const oldBadges = new Set(oldPlayer.badgesUnlocked ?? [])

    addRunes(runes)
    addXp(xp)
    saveSession(finished)

    const allSessions = loadSessions()
    const playerAfterGains = loadPlayer()
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
    })
  }

  const handleCloseRecap = () => {
    setRecap(null)
  }

  // --- Écran récap abandonné ---
  if (recap?.abandoned) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">séance abandonnée</p>
        <p className="mt-6 font-display text-3xl uppercase tracking-[0.1em] text-ash">
          Trop courte
        </p>
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
      </div>
    )
  }

  // --- Écran récap normal ---
  if (recap) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
          {recap.isTimerOnly ? 'séance libre forgée' : 'séance forgée'}
        </p>
        <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-full border border-ember bg-forge">
          <Anvil size={28} className="text-ember" />
        </div>

        <p className="mt-8 font-display text-5xl tracking-wider text-ember">
          +{recap.runes} {RUNE_SYMBOL}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-cream">
          runes d'effort
        </p>

        <p className="mt-6 font-display text-2xl tracking-wider text-cream">
          +{recap.xp} XP
        </p>

        {/* Stats de séance */}
        {!recap.isTimerOnly && recap.totalSets > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[10px] uppercase tracking-[0.2em] text-ash">
            {recap.totalExos > 0 && <span>{recap.totalExos} exercice{recap.totalExos > 1 ? 's' : ''}</span>}
            <span>{recap.totalSets} série{recap.totalSets > 1 ? 's' : ''}</span>
            {recap.totalVolume > 0 && <span>{recap.totalVolume} kg</span>}
            <span>{recap.durationMin} min</span>
          </div>
        )}
        {recap.isTimerOnly && (
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-ash">
            {recap.durationMin} min · séance sans exercices
          </p>
        )}

        {recap.levelUp && (
          <div className="mt-8 w-full max-w-xs rounded-xl border border-ember bg-forge p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Nouveau palier</p>
            <p className="mt-2 font-display text-2xl uppercase tracking-wider text-cream">
              {recap.newTitle}
            </p>
            <p className="mt-1 text-xs text-ash">Niveau {recap.newLevel}</p>
          </div>
        )}

        {recap.newBadges?.length > 0 && (
          <div className="mt-6 w-full max-w-xs space-y-2">
            <p className="text-center text-[10px] uppercase tracking-[0.3em] text-ash">
              {recap.newBadges.length === 1 ? 'Badge débloqué' : `${recap.newBadges.length} badges débloqués`}
            </p>
            {recap.newBadges.map((id) => {
              const b = findBadgeById(id)
              if (!b) return null
              const Icon = b.Icon
              return (
                <div key={id} className="flex items-center gap-3 rounded-xl border border-glow bg-forge p-3 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-glow bg-charcoal">
                    <Icon size={18} className="text-glow" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cream">{b.name}</p>
                    <p className="text-[10px] text-ash">{b.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={handleCloseRecap}
          className="mt-10 inline-flex items-center gap-2 rounded-md border border-ember bg-forge px-8 py-3 text-sm uppercase tracking-[0.25em] text-cream transition-all hover:bg-ember/20 hover:shadow-[0_0_24px_-8px_rgba(146,64,14,0.8)] active:scale-95"
        >
          Continuer
        </button>
      </div>
    )
  }

  // --- Écran initial (pas de séance) ---
  if (!active) {
    return (
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
      </div>
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
          const lastPerf = getLastPerformance(entry.exerciseId, historySessions)
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
                  {lastPerf && (
                    <p className="mt-0.5 text-[10px] text-ash/60">
                      Dernière fois · {lastPerf.weight || '—'}kg × {lastPerf.reps || '—'}
                    </p>
                  )}
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
                  {entry.sets.map((set, setIndex) => (
                    <li
                      key={setIndex}
                      className={`flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors ${
                        set.validated ? 'bg-glow/8' : ''
                      }`}
                    >
                      {/* Numéro ou check */}
                      <button
                        type="button"
                        onClick={() => handleValidateSet(entryIndex, setIndex)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-mono transition-colors ${
                          set.validated
                            ? 'bg-glow/20 text-glow'
                            : 'bg-transparent text-ash hover:text-glow'
                        }`}
                        aria-label={set.validated ? 'Dévalider la série' : 'Valider la série'}
                      >
                        {set.validated ? <Check size={12} /> : setIndex + 1}
                      </button>

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
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(entryIndex, setIndex)}
                        className="text-ash transition-colors hover:text-ember"
                        aria-label={`Supprimer la série ${setIndex + 1}`}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
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
