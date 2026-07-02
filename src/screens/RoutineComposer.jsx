import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check, Search } from 'lucide-react'
import { exercisesByGroup, EQUIPMENT } from '../domain/exercises'
import ExerciseThumb from '../components/ui/ExerciseThumb'
import { saveRoutine, buildRoutine } from '../storage/routines'

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export default function RoutineComposer() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [query, setQuery] = useState('')

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

  const toggle = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleCreate = () => {
    if (selectedIds.length === 0) return
    const r = buildRoutine(name.trim() || 'Ma routine', selectedIds)
    saveRoutine(r)
    navigate('/session')
  }

  const canCreate = selectedIds.length > 0

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
            Nouvelle routine
          </h1>
          <div className="w-9" aria-hidden />
        </div>

        <div className="mx-auto max-w-md space-y-2 px-4 pb-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la routine · ex. Full dos"
            className="w-full rounded-md border border-forge-light bg-forge px-3 py-2.5 text-base text-cream placeholder:text-ash/60 focus:border-ember focus:outline-none"
          />
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher un exercice…"
              className="w-full rounded-md border border-forge-light bg-forge py-2 pl-9 pr-3 text-sm text-cream placeholder:text-ash focus:border-ember focus:outline-none"
            />
          </label>
        </div>
      </header>

      <main
        className="mx-auto max-w-md px-4 py-6"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="px-1 font-display text-[10px] uppercase tracking-[0.4em] text-ash">
                {g.label}
              </h2>
              <ul className="mt-2 overflow-hidden rounded-2xl border border-forge-light bg-forge">
                {g.exercises.map((e, i) => {
                  const isSelected = selectedIds.includes(e.id)
                  return (
                    <li
                      key={e.id}
                      className={i > 0 ? 'border-t border-forge-light/60' : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(e.id)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-ember/10' : 'hover:bg-forge-light active:bg-forge-light'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <ExerciseThumb exerciseId={e.id} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-cream">{e.name}</p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ash">
                            {EQUIPMENT[e.equipment]}
                          </p>
                        </div>
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isSelected
                              ? 'border-ember bg-ember/25 text-cream'
                              : 'border-forge-light bg-charcoal text-ash/40'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={2.5} />}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </main>

      {/* CTA fixe en bas */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-forge-light bg-charcoal/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <p className="flex-1 text-[10px] uppercase tracking-[0.25em] text-ash">
            {selectedIds.length === 0
              ? 'Sélectionne des exercices'
              : `${selectedIds.length} exercice${selectedIds.length > 1 ? 's' : ''} choisi${selectedIds.length > 1 ? 's' : ''}`}
          </p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className={`inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-xs uppercase tracking-[0.25em] transition-all ${
              canCreate
                ? 'border-ember bg-forge text-cream hover:bg-ember/20 active:scale-95'
                : 'cursor-not-allowed border-forge-light bg-forge/40 text-ash/30'
            }`}
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}
