import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, X, Plus, Trash2, Anvil } from 'lucide-react'
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  createSession,
  saveSession,
  removeEntryFromActiveSession,
  addSetToEntry,
  updateSetInEntry,
  removeSetFromEntry,
} from '../storage/sessions'
import { findExerciseById, EQUIPMENT } from '../domain/exercises'

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

  const handleFinish = () => {
    if (!confirm('Terminer la séance ? Elle sera enregistrée dans tes chroniques.')) {
      return
    }
    const finished = { ...active, endedAt: new Date().toISOString() }
    saveSession(finished)
    clearActiveSession()
    setActive(null)
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
              <header className="flex items-start justify-between gap-3">
                <div>
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
                    <li
                      key={setIndex}
                      className="flex items-center gap-2"
                    >
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
