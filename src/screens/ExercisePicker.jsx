import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Search } from 'lucide-react'
import { exercisesByGroup, EQUIPMENT } from '../domain/exercises'
import ExerciseThumb from '../components/ui/ExerciseThumb'
import {
  addEntryToActiveSession,
  loadActiveSession,
  getRecentExercises,
  trackRecentExercise,
} from '../storage/sessions'
import { findExerciseById } from '../domain/exercises'

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export default function ExercisePicker() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  // Chargés au montage — l'écran est remonté à chaque navigation, donc toujours frais
  const [recents] = useState(() =>
    getRecentExercises()
      .map((id) => findExerciseById(id))
      .filter(Boolean)
  )

  useEffect(() => {
    if (!loadActiveSession()) {
      navigate('/session', { replace: true })
    }
  }, [navigate])

  const groups = useMemo(() => {
    const all = exercisesByGroup()
    if (!query.trim()) return all
    const q = normalize(query)
    return all
      .map((g) => ({
        ...g,
        exercises: g.exercises.filter((e) => normalize(e.name).includes(q)),
      }))
      .filter((g) => g.exercises.length > 0)
  }, [query])

  const handleSelect = (exercise) => {
    trackRecentExercise(exercise.id)
    addEntryToActiveSession(exercise.id)
    navigate('/session')
  }

  const totalShown = groups.reduce((acc, g) => acc + g.exercises.length, 0)

  return (
    <div
      className="min-h-screen bg-charcoal"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="sticky top-0 z-10 border-b border-forge-light bg-charcoal/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md p-2 text-ash transition-colors hover:bg-forge hover:text-cream"
            aria-label="Retour"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="flex-1 text-center font-display text-sm uppercase tracking-[0.3em] text-cream">
            Choisir un exercice
          </h1>
          <div className="w-9" aria-hidden />
        </div>
        <div className="mx-auto max-w-md px-4 pb-3">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash"
            />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-md border border-forge-light bg-forge py-2.5 pl-9 pr-3 text-base text-cream placeholder:text-ash focus:border-ember focus:outline-none"
            />
          </label>
        </div>
      </header>

      <main
        className="mx-auto max-w-md px-4 py-6"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        {totalShown === 0 ? (
          <p className="rounded-2xl border border-dashed border-forge-light bg-forge/40 p-6 text-center text-sm text-ash">
            Aucun exercice ne correspond à « {query} ».
          </p>
        ) : (
          <div className="space-y-6">
            {/* Section Récents — visible uniquement quand pas de recherche */}
            {recents.length > 0 && !query.trim() && (
              <section>
                <h2 className="px-1 font-display text-[10px] uppercase tracking-[0.4em] text-ash">
                  Récents
                </h2>
                <ul className="mt-2 overflow-hidden rounded-2xl border border-ember/40 bg-forge">
                  {recents.map((e, i) => (
                    <li key={e.id} className={i > 0 ? 'border-t border-forge-light/60' : undefined}>
                      <button
                        type="button"
                        onClick={() => handleSelect(e)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-forge-light active:bg-forge-light"
                      >
                        <ExerciseThumb exerciseId={e.id} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-cream">{e.name}</p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ash">
                            {EQUIPMENT[e.equipment]}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {groups.map((g) => (
              <section key={g.key}>
                <h2 className="px-1 font-display text-[10px] uppercase tracking-[0.4em] text-ash">
                  {g.label}
                </h2>
                <ul className="mt-2 overflow-hidden rounded-2xl border border-forge-light bg-forge">
                  {g.exercises.map((e, i) => (
                    <li
                      key={e.id}
                      className={
                        i > 0 ? 'border-t border-forge-light/60' : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(e)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-forge-light active:bg-forge-light"
                      >
                        <ExerciseThumb exerciseId={e.id} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-cream">{e.name}</p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ash">
                            {EQUIPMENT[e.equipment]}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
