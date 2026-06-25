import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, X, Plus, Trash2, Anvil } from 'lucide-react'
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
} from '../storage/sessions'
import { loadPlayer, savePlayer, addRunes, addXp } from '../storage/player'
import {
  computeSessionRunes,
  computeSessionXp,
  computeLevel,
  RUNE_SYMBOL,
} from '../domain/economy'
import { evaluateBadges, findBadgeById } from '../domain/badges'
import { findExerciseById, EQUIPMENT } from '../domain/exercises'
import ExerciseThumb from '../components/ui/ExerciseThumb'

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

export default function Session() {
  const [active, setActive] = useState(loadActiveSession)
  const [recap, setRecap] = useState(null)

  const handleStart = () => {
    const s = createSession()
    saveActiveSession(s)
    setActive(s)
  }

  const handleCancel = () => {
    if (confirm('Annuler cette séance ? Rien ne sera enregistré.')) {
      clearActiveSession()
      setActive(null)
    }
  }

  const handleRemoveEntry = (index) => {
    setActive(removeEntryFromActiveSession(index))
  }

  const handleAddSet = (entryIndex) => {
    setActive(addSetToEntry(entryIndex))
  }

  const handleUpdateSet = (entryIndex, setIndex, patch) => {
    setActive(updateSetInEntry(entryIndex, setIndex, patch))
  }

  const handleRemoveSet = (entryIndex, setIndex) => {
    setActive(removeSetFromEntry(entryIndex, setIndex))
  }

  const handleFinish = () => {
    if (
      !confirm(
        'Terminer la séance ? Elle sera enregistrée dans tes chroniques.'
      )
    ) {
      return
    }
    const finished = { ...active, endedAt: new Date().toISOString() }
    const runes = computeSessionRunes(finished)
    const xp = computeSessionXp(finished)
    const oldPlayer = loadPlayer()
    const oldLevel = computeLevel(oldPlayer.totalXp)
    const oldBadges = new Set(oldPlayer.badgesUnlocked ?? [])

    addRunes(runes)
    addXp(xp)
    saveSession(finished)

    // Ré-évalue les badges sur l'historique mis à jour
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
    })
  }

  const handleCloseRecap = () => {
    setRecap(null)
  }

  // --- Écran récap (priorité absolue) ---
  if (recap) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
          séance forgée
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

        {recap.levelUp && (
          <div className="mt-8 w-full max-w-xs rounded-xl border border-ember bg-forge p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-ash">
              Nouveau palier
            </p>
            <p className="mt-2 font-display text-2xl uppercase tracking-wider text-cream">
              {recap.newTitle}
            </p>
            <p className="mt-1 text-xs text-ash">Niveau {recap.newLevel}</p>
          </div>
        )}

        {recap.newBadges?.length > 0 && (
          <div className="mt-6 w-full max-w-xs space-y-2">
            <p className="text-center text-[10px] uppercase tracking-[0.3em] text-ash">
              {recap.newBadges.length === 1
                ? 'Badge débloqué'
                : `${recap.newBadges.length} badges débloqués`}
            </p>
            {recap.newBadges.map((id) => {
              const b = findBadgeById(id)
              if (!b) return null
              const Icon = b.Icon
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-glow bg-forge p-3 text-left"
                >
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
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
          aucune séance en cours
        </p>
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
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
          séance en cours
        </p>
        <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.15em] text-cream sm:text-4xl">
          Séance
        </h1>
        <p className="mt-3 text-xs text-ash first-letter:uppercase">
          {formatStartedAt(active.startedAt)}
        </p>
      </header>

      <section className="mx-auto mt-10 max-w-md space-y-3">
        {active.entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-forge-light bg-forge/40 p-8 text-center">
            <p className="text-sm text-ash">Aucun exercice ajouté.</p>
          </div>
        )}
        {active.entries.map((entry, entryIndex) => {
          const exo = findExerciseById(entry.exerciseId)
          return (
            <article
              key={entryIndex}
              className="rounded-2xl border border-forge-light bg-forge p-4"
            >
              <header className="flex items-start gap-3">
                {exo && <ExerciseThumb exerciseId={exo.id} />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-cream">
                    {exo?.name ?? entry.exerciseId}
                  </p>
                  {exo && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ash">
                      {EQUIPMENT[exo.equipment]}
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
                    <li key={setIndex} className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono text-xs text-ash">
                        {setIndex + 1}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={set.reps}
                        onChange={(e) =>
                          handleUpdateSet(entryIndex, setIndex, {
                            reps: e.target.value,
                          })
                        }
                        placeholder="reps"
                        className="w-16 rounded-md border border-forge-light bg-charcoal px-2 py-1.5 text-center text-base text-cream placeholder:text-ash/60 focus:border-ember focus:outline-none"
                      />
                      <span className="text-xs text-ash">×</span>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          value={set.weight}
                          onChange={(e) =>
                            handleUpdateSet(entryIndex, setIndex, {
                              weight: e.target.value,
                            })
                          }
                          placeholder="poids"
                          className="w-full rounded-md border border-forge-light bg-charcoal px-2 py-1.5 pr-8 text-center text-base text-cream placeholder:text-ash/60 focus:border-ember focus:outline-none"
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
    </div>
  )
}
