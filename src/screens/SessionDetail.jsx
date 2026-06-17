import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { findSession, deleteSession } from '../storage/sessions'
import { findExerciseById, EQUIPMENT } from '../domain/exercises'
import ExerciseThumb from '../components/ui/ExerciseThumb'

function formatLong(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(startISO, endISO) {
  if (!endISO) return '—'
  const mins = Math.round((new Date(endISO) - new Date(startISO)) / 60000)
  if (mins < 1) return '< 1 min'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} h` : `${h} h ${m}`
}

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session] = useState(() => findSession(id))

  if (!session) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ash">Séance introuvable.</p>
        <Link
          to="/stats"
          className="mt-6 text-xs uppercase tracking-[0.3em] text-ember hover:text-glow"
        >
          ← Retour aux chroniques
        </Link>
      </div>
    )
  }

  const handleDelete = () => {
    if (!confirm('Supprimer définitivement cette séance ?')) return
    deleteSession(session.id)
    navigate('/stats', { replace: true })
  }

  const totalSets = session.entries.reduce((a, e) => a + e.sets.length, 0)

  return (
    <div className="px-6 py-6">
      <header className="mx-auto max-w-md">
        <Link
          to="/stats"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:text-cream"
        >
          <ChevronLeft size={14} />
          Chroniques
        </Link>
        <div className="mt-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
            séance enregistrée
          </p>
          <h1 className="mt-3 font-display text-2xl uppercase tracking-[0.15em] text-cream sm:text-3xl">
            {formatLong(session.startedAt).split(' à ')[0]}
          </h1>
          <p className="mt-2 text-xs text-ash">
            {formatLong(session.startedAt).split(' à ').slice(1).join(' à ')} ·
            durée {formatDuration(session.startedAt, session.endedAt)}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-ash">
            {session.entries.length} exercice{session.entries.length > 1 ? 's' : ''} · {totalSets} série{totalSets > 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <section className="mx-auto mt-8 max-w-md space-y-3">
        {session.entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-forge-light bg-forge/40 p-6 text-center text-sm text-ash">
            Cette séance ne contient aucun exercice.
          </div>
        )}
        {session.entries.map((entry, i) => {
          const exo = findExerciseById(entry.exerciseId)
          return (
            <article
              key={i}
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
              </header>
              {entry.sets.length === 0 ? (
                <p className="mt-3 text-xs text-ash">Aucune série loguée.</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {entry.sets.map((set, si) => (
                    <li key={si} className="flex items-baseline gap-3 text-sm">
                      <span className="w-5 text-center font-mono text-xs text-ash">
                        {si + 1}
                      </span>
                      <span className="text-cream">
                        {set.reps || '—'} <span className="text-ash">×</span>{' '}
                        {set.weight || '0'} <span className="text-xs text-ash">kg</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )
        })}
      </section>

      <section className="mx-auto mt-10 flex max-w-md justify-center">
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-2 rounded-md border border-forge-light bg-transparent px-4 py-2 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:border-ember hover:text-ember"
        >
          <Trash2 size={14} />
          Supprimer cette séance
        </button>
      </section>
    </div>
  )
}
