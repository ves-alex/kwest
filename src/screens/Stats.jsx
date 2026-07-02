import { useState, useMemo } from 'react'
import { loadSessions, deleteSession } from '../storage/sessions'
import { findExerciseById } from '../domain/exercises'
import ConfirmModal from '../components/ui/ConfirmModal'
import SessionsList from './stats/SessionsList'
import StatsOverview from './stats/StatsOverview'
import ExerciseProgression from './stats/ExerciseProgression'

const TABS = [
  { id: 'sessions', label: 'Séances' },
  { id: 'progression', label: 'Progression' },
  { id: 'stats', label: 'Stats' },
]

export default function Stats() {
  const [sessions, setSessions] = useState(() =>
    loadSessions().sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
  )
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [view, setView] = useState('sessions')

  const exercisesInHistory = useMemo(() => {
    const counts = {}
    for (const s of sessions) {
      for (const e of s.entries) {
        counts[e.exerciseId] = (counts[e.exerciseId] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .map(([id, count]) => ({ exo: findExerciseById(id), id, count }))
      .filter((x) => x.exo)
      .sort((a, b) => b.count - a.count)
  }, [sessions])

  const trainedSet = useMemo(() => {
    const set = new Set()
    for (const s of sessions) {
      const d = new Date(s.startedAt)
      d.setHours(0, 0, 0, 0)
      set.add(d.toISOString().slice(0, 10))
    }
    return set
  }, [sessions])

  const handleDelete = (id) => {
    setPendingDeleteId(id)
    return false // snap back — le modal gère la confirmation
  }

  const confirmDelete = () => {
    if (!pendingDeleteId) return
    deleteSession(pendingDeleteId)
    setSessions((prev) => prev.filter((s) => s.id !== pendingDeleteId))
    setPendingDeleteId(null)
  }

  return (
    <div className="px-6 py-10">
      <header className="mx-auto max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
          {sessions.length === 0
            ? 'rien à raconter encore'
            : `${sessions.length} séance${sessions.length > 1 ? 's' : ''} forgée${sessions.length > 1 ? 's' : ''}`}
        </p>
        <h1 className="mt-4 font-display text-4xl uppercase tracking-[0.15em] text-cream sm:text-5xl sm:tracking-[0.2em]">
          Chroniques
        </h1>
        <div className="mt-6 flex justify-center gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                view === id
                  ? 'bg-ember/15 text-cream border border-ember/40'
                  : 'border border-forge-light text-ash hover:border-ash/60 hover:text-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="mx-auto mt-8 max-w-md">
        {view === 'sessions' && (
          <SessionsList sessions={sessions} onDelete={handleDelete} />
        )}
        {view === 'stats' && (
          <StatsOverview sessions={sessions} trainedSet={trainedSet} />
        )}
        {view === 'progression' && (
          <ExerciseProgression
            sessions={sessions}
            exercisesInHistory={exercisesInHistory}
          />
        )}
      </section>

      <ConfirmModal
        isOpen={!!pendingDeleteId}
        title="Supprimer cette séance ?"
        message="Cette action est irréversible. La séance sera retirée de tes chroniques."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
