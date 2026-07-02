import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { findSession, deleteSession } from '../storage/sessions'
import { findExerciseById, EQUIPMENT } from '../domain/exercises'
import ExerciseThumb from '../components/ui/ExerciseThumb'
import ConfirmModal from '../components/ui/ConfirmModal'
import { formatDuration } from '../lib/format'

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

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session] = useState(() => findSession(id))
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  const confirmDelete = () => {
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
          {session.rpe && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-ember/70">
              Ressenti · {['', 'facile', 'modéré', 'dur', 'très dur', 'à la limite'][session.rpe]}
            </p>
          )}
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
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-forge-light bg-transparent px-4 py-2 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:border-ember hover:text-ember"
        >
          <Trash2 size={14} />
          Supprimer cette séance
        </button>
      </section>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Supprimer cette séance ?"
        message="Cette action est irréversible. La séance sera retirée de tes chroniques."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
